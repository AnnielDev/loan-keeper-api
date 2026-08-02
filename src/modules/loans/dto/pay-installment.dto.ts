import { IsNumber, IsOptional, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class PayInstallmentDto {
  @IsOptional()
  @IsNumber({}, { message: i18nValidationMessage('validation.IS_NUMBER') })
  @Min(0, { message: i18nValidationMessage('validation.MIN') })
  amount?: number;
}
