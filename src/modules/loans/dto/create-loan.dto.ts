import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  InterestType,
  LoanType,
  PaymentFrequency,
} from '../schemas/loan.schema';

export class CreateLoanDto {
  @IsMongoId({ message: i18nValidationMessage('validation.IS_MONGO_ID') })
  customerId!: string;

  @IsEnum(LoanType, { message: i18nValidationMessage('validation.IS_ENUM') })
  type!: LoanType;

  @IsNumber({}, { message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  principal!: number;

  @IsNumber({}, { message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  interestRate!: number;

  @IsEnum(InterestType, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  interestType!: InterestType;

  @IsEnum(PaymentFrequency, {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  frequency!: PaymentFrequency;

  @IsInt({ message: i18nValidationMessage('validation.IS_INT') })
  @Min(1, { message: i18nValidationMessage('validation.MIN') })
  installmentsCount!: number;

  @IsDateString(
    {},
    { message: i18nValidationMessage('validation.IS_DATE_STRING') },
  )
  startDate!: string;

  @IsDateString(
    {},
    { message: i18nValidationMessage('validation.IS_DATE_STRING') },
  )
  collectionDate!: string;

  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isLegacy!: boolean;
}
