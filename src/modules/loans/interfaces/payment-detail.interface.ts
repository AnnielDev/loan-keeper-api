import { LoanType, PaymentMethod } from '../schemas/loan.schema';

export interface PaymentDetail {
  installmentId: string;
  loanId: string;
  loanCode: string;
  loanType: LoanType;
  customerName: string;
  customerAvatarUrl: string | null;
  amount: number;
  paidAmount: number;
  paidAt: Date | null;
  paymentMethod: PaymentMethod | null;
  referenceNumber: string | null;
  receiptUrl: string | null;
  notes: string | null;
  principal: number;
  totalInterest: number;
  totalAmount: number;
  principalPortion: number;
  interestPortion: number;
}
