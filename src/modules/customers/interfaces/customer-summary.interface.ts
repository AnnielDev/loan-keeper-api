export type CustomerStatus = 'active' | 'overdue';

export interface CustomerSummary {
  _id: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  pendingBalance: number;
  status: CustomerStatus;
}
