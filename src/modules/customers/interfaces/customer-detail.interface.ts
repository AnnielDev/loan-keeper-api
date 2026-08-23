import { LoanStatus } from '../../loans/interfaces/loan-summary.interface';
import { LoanType } from '../../loans/schemas/loan.schema';
import { RiskLevel } from '../schemas/customer.schema';

export interface CustomerLoanSummary {
  _id: string;
  code: string;
  type: LoanType;
  principal: number;
  totalAmount: number;
  paidAmount: number;
  progressPercent: number;
  status: LoanStatus;
  startDate: string;
  nextPaymentDate: string | null;
  daysOverdue: number | null;
  nextInstallmentId: string | null;
  nextInstallmentAmount: number | null;
}

export interface CustomerDetail {
  _id: string;
  fullName: string;
  documentId: string;
  phone: string | null;
  address: string | null;
  occupation: string | null;
  monthlyIncome: number | null;
  avatarUrl: string | null;
  documentUrls: string[];
  riskLevel: RiskLevel;
  createdAt: string;
  pendingBalance: number;
  totalLoaned: number;
  totalCollected: number;
  loans: CustomerLoanSummary[];
}
