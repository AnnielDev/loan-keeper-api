import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { diffInDaysInTimeZone } from '../../utils/date/timezone';
import { Loan, LoanDocument, LoanType } from '../loans/schemas/loan.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  CustomerDetail,
  CustomerLoanSummary,
} from './interfaces/customer-detail.interface';
import { CustomerSummary } from './interfaces/customer-summary.interface';
import {
  Customer,
  CustomerDocument,
  RiskLevel,
} from './schemas/customer.schema';

interface LeanCustomer {
  _id: Types.ObjectId;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
}

interface LeanCustomerDetail {
  _id: Types.ObjectId;
  fullName: string;
  documentId: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  riskLevel: RiskLevel;
  createdAt: Date;
}

interface LeanLoan {
  customer: Types.ObjectId;
  installments: { amount: number; paid: boolean; dueDate: Date }[];
}

interface LeanInstallment {
  _id: Types.ObjectId;
  dueDate: Date;
  amount: number;
  paid: boolean;
  paidAmount?: number;
}

interface LeanLoanDetail {
  _id: Types.ObjectId;
  code: string;
  type: LoanType;
  principal: number;
  totalAmount: number;
  installments: LeanInstallment[];
}

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isMongoDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === MONGO_DUPLICATE_KEY_ERROR_CODE
  );
}

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
  ) {}

  async create(dto: CreateCustomerDto, userId: string) {
    try {
      const customer = await this.customerModel.create({
        ...dto,
        registeredBy: userId,
      });
      return {
        message: I18nContext.current()?.t('customers.CUSTOMER_CREATED'),
        data: customer,
      };
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new ConflictException(
          I18nContext.current()?.t('customers.CUSTOMER_DOCUMENT_ID_EXISTS'),
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCustomerDto) {
    try {
      const customer = await this.customerModel.findByIdAndUpdate(id, dto, {
        new: true,
      });
      if (!customer) {
        throw new NotFoundException(
          I18nContext.current()?.t('customers.CUSTOMER_NOT_FOUND'),
        );
      }
      return {
        message: I18nContext.current()?.t('customers.CUSTOMER_UPDATED'),
        data: customer,
      };
    } catch (error) {
      if (isMongoDuplicateKeyError(error)) {
        throw new ConflictException(
          I18nContext.current()?.t('customers.CUSTOMER_DOCUMENT_ID_EXISTS'),
        );
      }
      throw error;
    }
  }

  async findAll(
    query: ListCustomersQueryDto,
    timezone?: string,
  ): Promise<CustomerSummary[]> {
    const filter: { $or?: Array<{ fullName: RegExp } | { phone: RegExp }> } =
      {};
    if (query.search) {
      const regex = new RegExp(escapeRegExp(query.search), 'i');
      filter.$or = [{ fullName: regex }, { phone: regex }];
    }

    const customers = await this.customerModel
      .find(filter)
      .sort({ fullName: 1 })
      .lean<LeanCustomer[]>();

    const customerIds = customers.map((customer) => customer._id);
    const loans = await this.loanModel
      .find({ customer: { $in: customerIds } })
      .select('customer installments')
      .lean<LeanLoan[]>();

    const now = new Date();
    const balanceByCustomer = new Map<
      string,
      { pendingBalance: number; isOverdue: boolean }
    >();

    for (const loan of loans) {
      const key = String(loan.customer);
      const entry = balanceByCustomer.get(key) ?? {
        pendingBalance: 0,
        isOverdue: false,
      };

      for (const installment of loan.installments) {
        if (installment.paid) continue;
        entry.pendingBalance += installment.amount;
        const daysUntilDue = diffInDaysInTimeZone(
          new Date(installment.dueDate),
          now,
          timezone,
        );
        if (daysUntilDue < 0) {
          entry.isOverdue = true;
        }
      }

      balanceByCustomer.set(key, entry);
    }

    const summaries: CustomerSummary[] = customers.map((customer) => {
      const entry = balanceByCustomer.get(String(customer._id)) ?? {
        pendingBalance: 0,
        isOverdue: false,
      };
      return {
        _id: String(customer._id),
        fullName: customer.fullName,
        phone: customer.phone ?? null,
        avatarUrl: customer.avatarUrl ?? null,
        pendingBalance: entry.pendingBalance,
        status: entry.isOverdue ? 'overdue' : 'active',
      };
    });

    if (query.status === 'active' || query.status === 'overdue') {
      return summaries.filter((summary) => summary.status === query.status);
    }
    return summaries;
  }

  async findOne(id: string) {
    const customer = await this.customerModel.findById(id);
    if (!customer) {
      throw new NotFoundException(
        I18nContext.current()?.t('customers.CUSTOMER_NOT_FOUND'),
      );
    }
    return customer;
  }

  async getDetail(id: string, timezone?: string): Promise<CustomerDetail> {
    const customer = await this.customerModel
      .findById(id)
      .lean<LeanCustomerDetail>();
    if (!customer) {
      throw new NotFoundException(
        I18nContext.current()?.t('customers.CUSTOMER_NOT_FOUND'),
      );
    }

    const loans = await this.loanModel
      .find({ customer: id })
      .sort({ createdAt: -1 })
      .lean<LeanLoanDetail[]>();

    const now = new Date();
    let pendingBalance = 0;
    let totalLoaned = 0;
    let totalCollected = 0;

    const loanSummaries: CustomerLoanSummary[] = loans.map((loan) => {
      totalLoaned += loan.principal;

      const paidAmount = loan.installments
        .filter((installment) => installment.paid)
        .reduce(
          (sum, installment) =>
            sum + (installment.paidAmount ?? installment.amount),
          0,
        );
      totalCollected += paidAmount;

      const unpaidInstallments = loan.installments
        .filter((installment) => !installment.paid)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
      pendingBalance += unpaidInstallments.reduce(
        (sum, installment) => sum + installment.amount,
        0,
      );

      const progressPercent =
        loan.totalAmount > 0
          ? Math.round((paidAmount / loan.totalAmount) * 100)
          : 0;

      const nextInstallment = unpaidInstallments[0];
      let status: CustomerLoanSummary['status'] = 'paid';
      let nextPaymentDate: string | null = null;
      let daysOverdue: number | null = null;

      if (nextInstallment) {
        nextPaymentDate = nextInstallment.dueDate.toISOString();
        const daysUntilDue = diffInDaysInTimeZone(
          nextInstallment.dueDate,
          now,
          timezone,
        );
        if (daysUntilDue < 0) {
          status = 'overdue';
          daysOverdue = Math.abs(daysUntilDue);
        } else {
          status = 'active';
        }
      }

      return {
        _id: String(loan._id),
        code: loan.code,
        type: loan.type,
        principal: loan.principal,
        totalAmount: loan.totalAmount,
        paidAmount,
        progressPercent,
        status,
        nextPaymentDate,
        daysOverdue,
        nextInstallmentId: nextInstallment ? String(nextInstallment._id) : null,
        nextInstallmentAmount: nextInstallment?.amount ?? null,
      };
    });

    return {
      _id: String(customer._id),
      fullName: customer.fullName,
      documentId: customer.documentId,
      phone: customer.phone ?? null,
      address: customer.address ?? null,
      avatarUrl: customer.avatarUrl ?? null,
      riskLevel: customer.riskLevel,
      createdAt: customer.createdAt.toISOString(),
      pendingBalance,
      totalLoaned,
      totalCollected,
      loans: loanSummaries,
    };
  }

  findByUser(userId: string) {
    return this.customerModel
      .find({ registeredBy: userId })
      .sort({ createdAt: -1 });
  }

  async remove(id: string) {
    const customer = await this.customerModel.findById(id);
    if (!customer) {
      throw new NotFoundException(
        I18nContext.current()?.t('customers.CUSTOMER_NOT_FOUND'),
      );
    }

    const loanCount = await this.loanModel.countDocuments({ customer: id });
    if (loanCount > 0) {
      throw new ConflictException(
        I18nContext.current()?.t('customers.CUSTOMER_HAS_LOANS'),
      );
    }

    await this.customerModel.deleteOne({ _id: id });

    return { message: I18nContext.current()?.t('customers.CUSTOMER_DELETED') };
  }

  count() {
    return this.customerModel.countDocuments();
  }
}
