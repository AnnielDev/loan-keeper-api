import { IsEmail, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
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
  @IsUrl({}, { message: i18nValidationMessage('validation.IS_URL') })
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(RiskLevel, { message: i18nValidationMessage('validation.IS_ENUM') })
  riskLevel?: RiskLevel;
}
