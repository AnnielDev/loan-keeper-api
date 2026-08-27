import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Currency, Language } from './user.schema';

export type PendingUserDocument = HydratedDocument<PendingUser>;

@Schema({ timestamps: true })
export class PendingUser {
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

  @Prop({ type: Number, default: 0 })
  balance!: number;

  @Prop({ required: true, select: false })
  code!: string;

  @Prop({ required: true, select: false })
  codeExpires!: Date;

  @Prop({ select: false, default: 0 })
  attempts!: number;

  // TTL index: Mongo purges this document 1h after it's created, so an
  // abandoned signup automatically frees up the email for a new attempt.
  @Prop({ type: Date, default: Date.now, expires: 3600 })
  expiresAt!: Date;
}

export const PendingUserSchema = SchemaFactory.createForClass(PendingUser);
