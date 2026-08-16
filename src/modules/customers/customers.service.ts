import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { diffInDaysInTimeZone } from '../../utils/date/timezone';
import { Loan, LoanDocument } from '../loans/schemas/loan.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { CustomerSummary } from './interfaces/customer-summary.interface';
import { Customer, CustomerDocument } from './schemas/customer.schema';

interface LeanCustomer {
  _id: Types.ObjectId;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
}

interface LeanLoan {
  customer: Types.ObjectId;
  installments: { amount: number; paid: boolean; dueDate: Date }[];
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

  findByUser(userId: string) {
    return this.customerModel
      .find({ registeredBy: userId })
      .sort({ createdAt: -1 });
  }

  count() {
    return this.customerModel.countDocuments();
  }
}
