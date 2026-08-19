import {
  InterestType,
  LoanType,
  PaymentFrequency,
  PaymentMethod,
} from '../schemas/loan.schema';
import { LoanStatus } from './loan-summary.interface';

export type InstallmentStatus = 'paid' | 'overdue' | 'pending';

export interface LoanDetailInstallment {
  _id: string;
  index: number;
  dueDate: Date;
  amount: number;
  paid: boolean;
  paidAt: Date | null;
  paidAmount: number | null;
  paymentMethod: PaymentMethod | null;
  referenceNumber: string | null;
  receiptUrl: string | null;
  notes: string | null;
  status: InstallmentStatus;
}

export interface LoanDetail {
  _id: string;
  code: string;
  type: LoanType;
  principal: number;
  interestRate: number;
  interestType: InterestType;
  frequency: PaymentFrequency;
  startDate: Date;
  totalInterest: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  progressPercent: number;
  status: LoanStatus;
  customerId: string;
  customerName: string;
  customerAvatarUrl: string | null;
  nextInstallmentId: string | null;
  nextInstallmentAmount: number | null;
  installments: LoanDetailInstallment[];
}
