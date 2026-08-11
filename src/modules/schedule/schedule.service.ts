import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { diffInDaysInTimeZone } from '../../utils/date/timezone';
import { Installment, Loan, LoanDocument } from '../loans/schemas/loan.schema';
import {
  ScheduleEvent,
  ScheduleEventStatus,
} from './interfaces/schedule-event.interface';

const DEFAULT_UPCOMING_LIMIT = 10;
const MIN_YEAR = 1970;
const MAX_YEAR = 3000;

interface PopulatedCustomer {
  _id: Types.ObjectId;
  fullName: string;
  avatarUrl?: string;
}

interface LeanInstallment extends Installment {
  _id: Types.ObjectId;
}

interface LeanLoan {
  _id: Types.ObjectId;
  code: string;
  installments: LeanInstallment[];
  customer: PopulatedCustomer | null;
}

@Injectable()
export class ScheduleService {
  constructor(@InjectModel(Loan.name) private loanModel: Model<LoanDocument>) {}

  async getEventsForMonth(
    month: number,
    year: number,
    timezone?: string,
  ): Promise<ScheduleEvent[]> {
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new BadRequestException(
        I18nContext.current()?.t('schedule.INVALID_MONTH'),
      );
    }
    if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
      throw new BadRequestException(
        I18nContext.current()?.t('schedule.INVALID_YEAR'),
      );
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const now = new Date();

    const loans = await this.loanModel
      .find({
        installments: {
          $elemMatch: { paid: false, dueDate: { $gte: start, $lt: end } },
        },
      })
      .populate<{ customer: PopulatedCustomer | null }>(
        'customer',
        'fullName avatarUrl',
      )
      .lean<LeanLoan[]>();

    const events: ScheduleEvent[] = [];
    for (const loan of loans) {
      for (const installment of loan.installments) {
        if (installment.paid) continue;
        const dueDate = new Date(installment.dueDate);
        if (dueDate < start || dueDate >= end) continue;
        events.push(this.toEvent(loan, installment, dueDate, now, timezone));
      }
    }

    return events.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  async getUpcoming(
    limit: number = DEFAULT_UPCOMING_LIMIT,
    timezone?: string,
  ): Promise<ScheduleEvent[]> {
    const now = new Date();

    const loans = await this.loanModel
      .find({ 'installments.paid': false })
      .populate<{
        customer: PopulatedCustomer | null;
      }>('customer', 'fullName avatarUrl')
      .lean<LeanLoan[]>();

    const events: ScheduleEvent[] = [];
    for (const loan of loans) {
      for (const installment of loan.installments) {
        if (installment.paid) continue;
        const dueDate = new Date(installment.dueDate);
        events.push(this.toEvent(loan, installment, dueDate, now, timezone));
      }
    }

    events.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return events.slice(0, limit);
  }

  private toEvent(
    loan: LeanLoan,
    installment: LeanInstallment,
    dueDate: Date,
    now: Date,
    timezone?: string,
  ): ScheduleEvent {
    const daysUntilDue = diffInDaysInTimeZone(dueDate, now, timezone);
    return {
      installmentId: String(installment._id),
      loanId: String(loan._id),
      loanCode: loan.code,
      customerId: String(loan.customer?._id ?? ''),
      customerName: loan.customer?.fullName ?? 'Cliente',
      avatarUrl: loan.customer?.avatarUrl ?? null,
      amount: installment.amount,
      dueDate,
      daysUntilDue,
      status: this.statusFromDays(daysUntilDue),
    };
  }

  private statusFromDays(days: number): ScheduleEventStatus {
    if (days < 0) return 'overdue';
    if (days === 0) return 'today';
    return 'upcoming';
  }
}
