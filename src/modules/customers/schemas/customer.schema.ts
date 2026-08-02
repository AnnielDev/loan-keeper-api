import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerDocument = HydratedDocument<Customer>;

export enum RiskLevel {
  LOW = 'bajo',
  MEDIUM = 'medio',
  HIGH = 'alto',
}

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, trim: true })
  fullName!: string;

  @Prop({ required: true, trim: true, unique: true })
  documentId!: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  address?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ type: String, enum: RiskLevel, default: RiskLevel.LOW })
  riskLevel!: RiskLevel;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  registeredBy!: Types.ObjectId;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
