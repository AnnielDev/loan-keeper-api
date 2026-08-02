import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { CreateLoanDto } from './dto/create-loan.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import {
  InterestType,
  LOAN_TYPE_CODE_PREFIX,
  Loan,
  LoanDocument,
  PaymentFrequency,
} from './schemas/loan.schema';

const CODE_SEQUENCE_PADDING = 4;

@Injectable()
export class LoansService {
  constructor(@InjectModel(Loan.name) private loanModel: Model<LoanDocument>) {}

  async create(dto: CreateLoanDto) {
    const code = await this.generateCode(dto.type);
    const totalInterest = this.calculateTotalInterest(dto);
    const totalAmount = dto.principal + totalInterest;
    const installments = this.buildInstallments(dto, totalAmount);

    return this.loanModel.create({
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
    });
  }

  findAll() {
    return this.loanModel
      .find()
      .populate('customer', 'fullName avatarUrl')
      .sort({ createdAt: -1 });
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
    installment.paidAt = new Date();
    installment.paidAmount = dto.amount ?? installment.amount;

    await loan.save();
    return loan;
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
