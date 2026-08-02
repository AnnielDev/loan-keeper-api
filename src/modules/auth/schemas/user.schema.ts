import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum Language {
  EN = 'en',
  ES = 'es',
  ZH = 'zh',
  HI = 'hi',
  FR = 'fr',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  DOP = 'DOP',
  MXN = 'MXN',
  COP = 'COP',
  ARS = 'ARS',
  PEN = 'PEN',
  CLP = 'CLP',
  GTQ = 'GTQ',
  HNL = 'HNL',
  GBP = 'GBP',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  BRL = 'BRL',
  CNY = 'CNY',
  CHF = 'CHF',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ type: String, enum: Language, default: Language.EN })
  language!: Language;

  @Prop({ type: String, enum: Currency, default: Currency.USD })
  currency!: Currency;
}

export const UserSchema = SchemaFactory.createForClass(User);
