import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { diffInDaysInTimeZone } from '../../utils/date/timezone';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ListLoansQueryDto } from './dto/list-loans-query.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import {
  InstallmentStatus,
  LoanDetail,
  LoanDetailInstallment,
} from './interfaces/loan-detail.interface';
import { LoanStatus, LoanSummary } from './interfaces/loan-summary.interface';
import {
  InterestType,
  LOAN_TYPE_CODE_PREFIX,
  Loan,
  LoanDocument,
  PaymentFrequency,
  PaymentMethod,
} from './schemas/loan.schema';

const CODE_SEQUENCE_PADDING = 4;

interface LeanInstallment {
  dueDate: Date;
  amount: number;
  paid: boolean;
  paidAmount?: number;
}

interface LeanCustomer {
  _id: Types.ObjectId;
  fullName: string;
  avatarUrl?: string;
}

interface LeanLoan {
  _id: Types.ObjectId;
  code: string;
  customer: LeanCustomer;
  totalAmount: number;
  installments: LeanInstallment[];
}

interface LeanDetailInstallment {
  _id: Types.ObjectId;
  dueDate: Date;
  amount: number;
  paid: boolean;
  paidAt?: Date;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
}

interface LeanLoanDetail {
  _id: Types.ObjectId;
  code: string;
  type: LoanDetail['type'];
  principal: number;
  interestRate: number;
  interestType: InterestType;
  frequency: PaymentFrequency;
  startDate: Date;
  totalInterest: number;
  totalAmount: number;
  customer: LeanCustomer | null;
  installments: LeanDetailInstallment[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class LoansService {
  constructor(
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateLoanDto, userId: string) {
    const code = await this.generateCode(dto.type);
    const totalInterest = this.calculateTotalInterest(dto);
    const totalAmount = dto.principal + totalInterest;
    const installments = this.buildInstallments(dto, totalAmount);

    const loan = await this.loanModel.create({
      customer: dto.customerId,
      code,
      type: dto.type,
      principal: dto.principal,
      interestRate: dto.interestRate,
      interestType: dto.interestType,
      frequency: dto.frequency,
      startDate: dto.startDate,
      totalInterest,
      totalAmount,
      installments,
      registeredBy: userId,
    });

    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { balance: -dto.principal },
    });

    return {
      message: I18nContext.current()?.t('loans.LOAN_CREATED'),
      data: loan,
    };
  }

  async findAll(
    query: ListLoansQueryDto,
    timezone?: string,
  ): Promise<LoanSummary[]> {
    const loans = await this.loanModel
      .find()
      .populate('customer', 'fullName avatarUrl')
      .sort({ createdAt: -1 })
      .lean<LeanLoan[]>();

    const now = new Date();
    let summaries = loans.map((loan) => this.toSummary(loan, now, timezone));

    if (query.search) {
      const regex = new RegExp(escapeRegExp(query.search), 'i');
      summaries = summaries.filter(
        (summary) =>
          regex.test(summary.code) || regex.test(summary.customerName),
      );
    }

    if (query.status && query.status !== 'all') {
      summaries = summaries.filter(
        (summary) => summary.status === query.status,
      );
    }

    return summaries;
  }

  findByUser(userId: string) {
    return this.loanModel
      .find({ registeredBy: userId })
      .populate('customer', 'fullName avatarUrl')
      .sort({ createdAt: -1 });
  }

  findByCustomer(customerId: string) {
    return this.loanModel
      .find({ customer: customerId })
      .populate('customer', 'fullName avatarUrl')
      .sort({ createdAt: -1 });
  }

  async getDetail(id: string, timezone?: string): Promise<LoanDetail> {
    const loan = await this.loanModel
      .findById(id)
      .populate<{
        customer: LeanCustomer | null;
      }>('customer', 'fullName avatarUrl')
      .lean<LeanLoanDetail>();
    if (!loan) {
      throw new NotFoundException(
        I18nContext.current()?.t('loans.LOAN_NOT_FOUND'),
      );
    }

    const now = new Date();
    const paidAmount = loan.installments
      .filter((installment) => installment.paid)
      .reduce(
        (sum, installment) =>
          sum + (installment.paidAmount ?? installment.amount),
        0,
      );
    const progressPercent =
      loan.totalAmount > 0
        ? Math.round((paidAmount / loan.totalAmount) * 100)
        : 0;

    const installments: LoanDetailInstallment[] = loan.installments.map(
      (installment, index) => {
        const daysUntilDue = diffInDaysInTimeZone(
          installment.dueDate,
          now,
          timezone,
        );
        const status: InstallmentStatus = installment.paid
          ? 'paid'
          : daysUntilDue < 0
            ? 'overdue'
            : 'pending';

        return {
          _id: String(installment._id),
          index: index + 1,
          dueDate: installment.dueDate,
          amount: installment.amount,
          paid: installment.paid,
          paidAt: installment.paidAt ?? null,
          paidAmount: installment.paidAmount ?? null,
          paymentMethod: installment.paymentMethod ?? null,
          referenceNumber: installment.referenceNumber ?? null,
          receiptUrl: installment.receiptUrl ?? null,
          notes: installment.notes ?? null,
          status,
        };
      },
    );

    const nextInstallment = loan.installments
      .filter((installment) => !installment.paid)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

    let status: LoanStatus = 'paid';
    if (nextInstallment) {
      const daysUntilDue = diffInDaysInTimeZone(
        nextInstallment.dueDate,
        now,
        timezone,
      );
      status = daysUntilDue < 0 ? 'overdue' : 'active';
    }

    return {
      _id: String(loan._id),
      code: loan.code,
      type: loan.type,
      principal: loan.principal,
      interestRate: loan.interestRate,
      interestType: loan.interestType,
      frequency: loan.frequency,
      startDate: loan.startDate,
      totalInterest: loan.totalInterest,
      totalAmount: loan.totalAmount,
      paidAmount,
      remainingBalance: loan.totalAmount - paidAmount,
      progressPercent,
      status,
      customerId: String(loan.customer?._id ?? ''),
      customerName: loan.customer?.fullName ?? '',
      customerAvatarUrl: loan.customer?.avatarUrl ?? null,
      nextInstallmentId: nextInstallment ? String(nextInstallment._id) : null,
      nextInstallmentAmount: nextInstallment?.amount ?? null,
      installments,
    };
  }

  async remove(id: string) {
    const loan = await this.loanModel.findById(id);
    if (!loan) {
      throw new NotFoundException(
        I18nContext.current()?.t('loans.LOAN_NOT_FOUND'),
      );
    }

    const paidAmount = loan.installments
      .filter((installment) => installment.paid)
      .reduce(
        (sum, installment) =>
          sum + (installment.paidAmount ?? installment.amount),
        0,
      );

    await this.loanModel.deleteOne({ _id: id });

    await this.userModel.findByIdAndUpdate(loan.registeredBy, {
      $inc: { balance: loan.principal - paidAmount },
    });

    return { message: I18nContext.current()?.t('loans.LOAN_DELETED') };
  }

  async payInstallment(
    loanId: string,
    installmentId: string,
    dto: PayInstallmentDto,
  ) {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) {
      throw new NotFoundException(
        I18nContext.current()?.t('loans.LOAN_NOT_FOUND'),
      );
    }

    const installment = loan.installments.id(installmentId);
    if (!installment) {
      throw new NotFoundException(
        I18nContext.current()?.t('loans.INSTALLMENT_NOT_FOUND'),
      );
    }

    installment.paid = true;
    installment.paidAt = dto.paymentDate
      ? new Date(dto.paymentDate)
      : new Date();
    installment.paidAmount = dto.amount ?? installment.amount;
    installment.paymentMethod = dto.paymentMethod;
    installment.referenceNumber = dto.referenceNumber;
    installment.receiptUrl = dto.receiptUrl;
    installment.notes = dto.notes;

    await loan.save();

    await this.userModel.findByIdAndUpdate(loan.registeredBy, {
      $inc: { balance: installment.paidAmount },
    });

    return {
      message: I18nContext.current()?.t('loans.INSTALLMENT_PAID'),
      data: loan,
    };
  }

  private toSummary(loan: LeanLoan, now: Date, timezone?: string): LoanSummary {
    const paidAmount = loan.installments
      .filter((installment) => installment.paid)
      .reduce(
        (sum, installment) =>
          sum + (installment.paidAmount ?? installment.amount),
        0,
      );
    const progressPercent =
      loan.totalAmount > 0
        ? Math.round((paidAmount / loan.totalAmount) * 100)
        : 0;

    const nextInstallment = loan.installments
      .filter((installment) => !installment.paid)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

    let status: LoanStatus = 'paid';
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
      customerId: String(loan.customer?._id ?? ''),
      customerName: loan.customer?.fullName ?? '',
      customerAvatarUrl: loan.customer?.avatarUrl ?? null,
      totalAmount: loan.totalAmount,
      progressPercent,
      status,
      nextPaymentDate,
      daysOverdue,
    };
  }

  private calculateTotalInterest(dto: CreateLoanDto): number {
    if (dto.interestType === InterestType.COMPOUND) {
      const compounded =
        dto.principal *
        Math.pow(1 + dto.interestRate / 100, dto.installmentsCount);
      return this.round(compounded - dto.principal);
    }

    return this.round(dto.principal * (dto.interestRate / 100));
  }

  private buildInstallments(dto: CreateLoanDto, totalAmount: number) {
    const baseAmount = this.round(totalAmount / dto.installmentsCount);
    const startDate = new Date(dto.startDate);

    return Array.from({ length: dto.installmentsCount }, (_, index) => {
      const isLast = index === dto.installmentsCount - 1;
      const amount = isLast
        ? this.round(totalAmount - baseAmount * (dto.installmentsCount - 1))
        : baseAmount;

      return {
        dueDate: this.addPeriods(startDate, dto.frequency, index + 1),
        amount,
        paid: false,
      };
    });
  }

  private addPeriods(
    startDate: Date,
    frequency: PaymentFrequency,
    periods: number,
  ): Date {
    const date = new Date(startDate);
    if (frequency === PaymentFrequency.WEEKLY) {
      date.setDate(date.getDate() + periods * 7);
    } else if (frequency === PaymentFrequency.BIWEEKLY) {
      date.setDate(date.getDate() + periods * 14);
    } else if (frequency === PaymentFrequency.EVERY_2_MONTHS) {
      date.setMonth(date.getMonth() + periods * 2);
    } else if (frequency === PaymentFrequency.EVERY_3_MONTHS) {
      date.setMonth(date.getMonth() + periods * 3);
    } else {
      date.setMonth(date.getMonth() + periods);
    }
    return date;
  }

  private async generateCode(type: CreateLoanDto['type']): Promise<string> {
    const prefix = LOAN_TYPE_CODE_PREFIX[type];
    const count = await this.loanModel.countDocuments({ type });
    const sequence = String(count + 1).padStart(CODE_SEQUENCE_PADDING, '0');
    return `${prefix}-${sequence}`;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
