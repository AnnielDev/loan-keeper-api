import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { RiskLevel } from '../schemas/customer.schema';

export class CreateCustomerDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  fullName!: string;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  documentId!: string;

  @IsOptional()
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  phone?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  address?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  city?: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  occupation?: string;

  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  monthlyIncome?: number;

  @IsOptional()
  @IsUrl({}, { message: i18nValidationMessage('validation.IS_URL') })
  avatarUrl?: string;

  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @IsUrl(
    {},
    { each: true, message: i18nValidationMessage('validation.IS_URL') },
  )
  documentUrls?: string[];

  @IsOptional()
  @IsEnum(RiskLevel, { message: i18nValidationMessage('validation.IS_ENUM') })
  riskLevel?: RiskLevel;
}
