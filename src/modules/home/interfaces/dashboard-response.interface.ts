export type DueStatus = 'upcoming' | 'today' | 'overdue';

export interface MonthlyIncomePoint {
  month: string;
  amount: number;
}

export interface UpcomingDueDate {
  customerId: string;
  customerName: string;
  avatarUrl: string | null;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
  status: DueStatus;
}

export interface DashboardResponse {
  pendingToday: number;
  balance: number;
  totalLoaned: {
    amount: number;
    growthPercentage: number;
  };
  collected: {
    amount: number;
  };
  pending: {
    amount: number;
  };
  stats: {
    customers: number;
    active: number;
    overdue: number;
  };
  monthlyIncome: MonthlyIncomePoint[];
  upcomingDueDates: UpcomingDueDate[];
}
