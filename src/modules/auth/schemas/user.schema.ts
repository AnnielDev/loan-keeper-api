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
      delete ret.refreshToken;
      delete ret.passwordResetCode;
      delete ret.passwordResetExpires;
      delete ret.passwordResetAttempts;
      delete ret.passwordResetVerified;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: String, enum: Language, default: Language.EN })
  language!: Language;

  @Prop({ type: String, enum: Currency, default: Currency.USD })
  currency!: Currency;

  // ISO 3166-1 alpha-2 country code; auto-detected from signup/login IP,
  // editable by the user (no enum: values come from an external standard,
  // not a fixed business catalog like Language/Currency).
  @Prop()
  country?: string;

  // IANA time zone name (e.g. "America/Santo_Domingo"); auto-detected from
  // signup/login IP, editable by the user. Used to compute day boundaries
  // (due today, overdue) in the user's own region instead of server time.
  @Prop()
  timezone?: string;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ select: false })
  passwordResetCode?: string;

  @Prop({ select: false })
  passwordResetExpires?: Date;

  @Prop({ select: false, default: 0 })
  passwordResetAttempts?: number;

  @Prop({ select: false, default: false })
  passwordResetVerified?: boolean;

  @Prop()
  lastLoginAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
