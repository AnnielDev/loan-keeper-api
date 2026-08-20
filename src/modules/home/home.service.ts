import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { diffInDaysFromDueDate } from '../../utils/date/timezone';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { Installment, Loan, LoanDocument } from '../loans/schemas/loan.schema';
import {
  DashboardResponse,
  DueStatus,
  UpcomingDueDate,
} from './interfaces/dashboard-response.interface';

const UPCOMING_DUE_DATES_LIMIT = 3;
const MONTHS_IN_CHART = 6;

interface PopulatedCustomer {
  _id: Types.ObjectId;
  fullName: string;
  avatarUrl?: string;
}

interface LeanLoan {
  _id: Types.ObjectId;
  principal: number;
  createdAt: Date;
  installments: Installment[];
  customer: PopulatedCustomer | null;
}

@Injectable()
export class HomeService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Loan.name) private readonly loanModel: Model<LoanDocument>,
  ) {}

  async getDashboard(
    timezone?: string,
    balance = 0,
  ): Promise<DashboardResponse> {
    const now = new Date();
    const [customersCount, loans] = await Promise.all([
      this.customerModel.countDocuments(),
      this.loanModel
        .find()
        .populate<{
          customer: PopulatedCustomer | null;
        }>('customer', 'fullName avatarUrl')
        .lean<LeanLoan[]>(),
    ]);

    let totalLoaned = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let pendingToday = 0;
    let activeCount = 0;
    let overdueCount = 0;
    const monthlyIncomeTotals = new Map<string, number>();
    const upcomingDueDates: UpcomingDueDate[] = [];

    for (const loan of loans) {
      totalLoaned += loan.principal;

      let hasOverdueInstallment = false;
      let hasPendingInstallment = false;

      for (const installment of loan.installments) {
        if (installment.paid) {
          const paidAmount = installment.paidAmount ?? installment.amount;
          totalCollected += paidAmount;
          if (installment.paidAt) {
            const key = this.monthKey(new Date(installment.paidAt));
            monthlyIncomeTotals.set(
              key,
              (monthlyIncomeTotals.get(key) ?? 0) + paidAmount,
            );
          }
          continue;
        }

        hasPendingInstallment = true;
        totalPending += installment.amount;

        const dueDate = new Date(installment.dueDate);
        const daysUntilDue = diffInDaysFromDueDate(dueDate, now, timezone);
        if (daysUntilDue < 0) {
          hasOverdueInstallment = true;
        }
        if (daysUntilDue === 0) {
          pendingToday += 1;
        }

        upcomingDueDates.push({
          customerId: String(loan.customer?._id ?? ''),
          customerName: loan.customer?.fullName ?? 'Cliente',
          avatarUrl: loan.customer?.avatarUrl ?? null,
          amount: installment.amount,
          dueDate,
          daysUntilDue,
          status: this.statusFromDays(daysUntilDue),
        });
      }

      if (hasOverdueInstallment) {
        overdueCount += 1;
      } else if (hasPendingInstallment) {
        activeCount += 1;
      }
    }

    upcomingDueDates.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    const monthlyIncome = this.buildLastMonths(now).map(({ key, label }) => ({
      month: label,
      amount: monthlyIncomeTotals.get(key) ?? 0,
    }));

    const growthPercentage = await this.getLoanedGrowthPercentage(now);

    return {
      pendingToday,
      balance,
      totalLoaned: { amount: totalLoaned, growthPercentage },
      collected: { amount: totalCollected },
      pending: { amount: totalPending },
      stats: {
        customers: customersCount,
        active: activeCount,
        overdue: overdueCount,
      },
      monthlyIncome,
      upcomingDueDates: upcomingDueDates.slice(0, UPCOMING_DUE_DATES_LIMIT),
    };
  }

  private async getLoanedGrowthPercentage(now: Date): Promise<number> {
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [[thisMonth], [lastMonth]] = await Promise.all([
      this.loanModel.aggregate<{ total: number }>([
        { $match: { createdAt: { $gte: startOfThisMonth } } },
        { $group: { _id: null, total: { $sum: '$principal' } } },
      ]),
      this.loanModel.aggregate<{ total: number }>([
        {
          $match: {
            createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
          },
        },
        { $group: { _id: null, total: { $sum: '$principal' } } },
      ]),
    ]);

    const thisMonthTotal = thisMonth?.total ?? 0;
    const lastMonthTotal = lastMonth?.total ?? 0;

    if (lastMonthTotal === 0) {
      return thisMonthTotal > 0 ? 100 : 0;
    }

    return Math.round(
      ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100,
    );
  }

  private buildLastMonths(reference: Date): { key: string; label: string }[] {
    const months: { key: string; label: string }[] = [];
    for (let i = MONTHS_IN_CHART - 1; i >= 0; i -= 1) {
      const date = new Date(
        reference.getFullYear(),
        reference.getMonth() - i,
        1,
      );
      months.push({ key: this.monthKey(date), label: this.monthLabel(date) });
    }
    return months;
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }

  private monthLabel(date: Date): string {
    return date
      .toLocaleDateString('es', { month: 'short' })
      .replace('.', '')
      .toUpperCase();
  }

  private statusFromDays(days: number): DueStatus {
    if (days < 0) return 'overdue';
    if (days === 0) return 'today';
    return 'upcoming';
  }
}
