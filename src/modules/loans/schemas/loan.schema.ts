import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Customer } from '../../customers/schemas/customer.schema';

export type LoanDocument = HydratedDocument<Loan>;

export enum LoanType {
  PERSONAL = 'personal',
  MICRO_CREDIT = 'micro_credito',
}

export enum InterestType {
  SIMPLE = 'simple',
  COMPOUND = 'compound',
}

export enum PaymentFrequency {
  MONTHLY = 'monthly',
  EVERY_2_MONTHS = 'every_2_months',
  EVERY_3_MONTHS = 'every_3_months',
}

export const LOAN_TYPE_CODE_PREFIX: Record<LoanType, string> = {
  [LoanType.PERSONAL]: 'LP',
  [LoanType.MICRO_CREDIT]: 'MC',
};

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card',
  OTHER = 'other',
}

@Schema()
export class Installment {
  @Prop({ required: true })
  dueDate!: Date;

  @Prop({ required: true })
  amount!: number;

  @Prop({ default: false })
  paid!: boolean;

  @Prop()
  paidAt?: Date;

  @Prop()
  paidAmount?: number;

  @Prop({ type: String, enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @Prop()
  referenceNumber?: string;

  @Prop()
  receiptUrl?: string;

  @Prop()
  notes?: string;
}

export const InstallmentSchema = SchemaFactory.createForClass(Installment);

@Schema({ timestamps: true })
export class Loan {
  @Prop({ type: SchemaTypes.ObjectId, ref: Customer.name, required: true })
  customer!: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  code!: string;

  @Prop({ type: String, enum: LoanType, required: true })
  type!: LoanType;

  @Prop({ required: true })
  principal!: number;

  @Prop({ required: true })
  interestRate!: number;

  @Prop({ type: String, enum: InterestType, default: InterestType.SIMPLE })
  interestType!: InterestType;

  @Prop({
    type: String,
    enum: PaymentFrequency,
    default: PaymentFrequency.MONTHLY,
  })
  frequency!: PaymentFrequency;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  collectionDate!: Date;

  @Prop({ required: true })
  totalInterest!: number;

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({ type: [InstallmentSchema], default: [] })
  installments!: Types.DocumentArray<Installment>;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  registeredBy!: Types.ObjectId;

  /**
   * A loan migrated from a process the lender ran before adopting this app.
   * Legacy loans are recorded for tracking (schedule, payments) but must
   * never move the lender's own capital balance or feed monetary
   * aggregates/statistics, since that money was already lent out before.
   */
  @Prop({ default: false })
  isLegacy!: boolean;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
