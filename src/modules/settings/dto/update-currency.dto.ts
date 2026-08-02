import { IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Currency } from '../../auth/schemas/user.schema';

export class UpdateCurrencyDto {
  @IsEnum(Currency, { message: i18nValidationMessage('validation.IS_ENUM') })
  currency!: Currency;
}
