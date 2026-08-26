export type LoanStatus = 'active' | 'overdue' | 'paid';

export interface LoanSummary {
  _id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerAvatarUrl: string | null;
  totalAmount: number;
  isLegacy: boolean;
  progressPercent: number;
  status: LoanStatus;
  nextPaymentDate: string | null;
  daysOverdue: number | null;
}
