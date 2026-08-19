import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaymentMethod } from '../schemas/loan.schema';

export class PayInstallmentDto {
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  referenceNumber?: string;

  @IsOptional()
  @IsUrl({}, { message: i18nValidationMessage('validation.IS_URL') })
  receiptUrl?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  notes?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: i18nValidationMessage('validation.IS_DATE_STRING') },
  )
  paymentDate?: string;
}
