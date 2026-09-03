import { IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class VerifyPurchaseDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  purchaseToken!: string;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  productId!: string;
}
