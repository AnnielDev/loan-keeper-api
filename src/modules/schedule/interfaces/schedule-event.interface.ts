export type ScheduleEventStatus = 'upcoming' | 'today' | 'overdue';

export interface ScheduleEvent {
  installmentId: string;
  loanId: string;
  loanCode: string;
  customerId: string;
  customerName: string;
  avatarUrl: string | null;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
  status: ScheduleEventStatus;
}
