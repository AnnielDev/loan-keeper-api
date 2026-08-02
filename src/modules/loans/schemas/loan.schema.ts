import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
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
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

export const LOAN_TYPE_CODE_PREFIX: Record<LoanType, string> = {
  [LoanType.PERSONAL]: 'LP',
  [LoanType.MICRO_CREDIT]: 'MC',
};

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
}

export const InstallmentSchema = SchemaFactory.createForClass(Installment);

@Schema({ timestamps: true })
export class Loan {
  @Prop({ type: Types.ObjectId, ref: Customer.name, required: true })
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
  totalInterest!: number;

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({ type: [InstallmentSchema], default: [] })
  installments!: Types.DocumentArray<Installment>;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  registeredBy!: Types.ObjectId;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);
