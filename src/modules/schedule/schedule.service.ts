import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { diffInDaysFromDueDate } from '../../utils/date/timezone';
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
    userId: string,
    timezone?: string,
    includePaid = false,
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

    // Filtering by dueDate range at the query level requires every stored
    // installment to be a real BSON Date; a legacy/imported loan whose
    // installments were written outside the Mongoose schema (e.g. a direct
    // DB write with string dates) would silently fail that match and never
    // come back, even though the data is fine. Fetching by user and
    // filtering/casting dates in application code is robust to that either
    // way, regardless of loan type or how old the due date is.
    const loans = await this.loanModel
      .find({ registeredBy: userId })
      .populate<{ customer: PopulatedCustomer | null }>(
        'customer',
        'fullName avatarUrl',
      )
      .lean<LeanLoan[]>();

    const events: ScheduleEvent[] = [];
    for (const loan of loans) {
      for (const installment of loan.installments) {
        if (!includePaid && installment.paid) continue;
        const dueDate = new Date(installment.dueDate);
        if (Number.isNaN(dueDate.getTime())) continue;
        if (dueDate < start || dueDate >= end) continue;
        events.push(this.toEvent(loan, installment, dueDate, now, timezone));
      }
    }

    return events.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  async getUpcoming(
    userId: string,
    limit: number = DEFAULT_UPCOMING_LIMIT,
    timezone?: string,
  ): Promise<ScheduleEvent[]> {
    const now = new Date();

    const loans = await this.loanModel
      .find({ registeredBy: userId, 'installments.paid': false })
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
    const daysUntilDue = diffInDaysFromDueDate(dueDate, now, timezone);
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
      status: installment.paid
        ? 'completed'
        : this.statusFromDays(daysUntilDue),
    };
  }

  private statusFromDays(days: number): ScheduleEventStatus {
    if (days < 0) return 'overdue';
    if (days === 0) return 'today';
    return 'upcoming';
  }
}
