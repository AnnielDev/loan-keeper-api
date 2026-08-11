import { IsISO31661Alpha2, IsOptional, IsTimeZone } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateLocationDto {
  @IsOptional()
  @IsISO31661Alpha2({
    message: i18nValidationMessage('validation.IS_ISO31661_ALPHA2'),
  })
  country?: string;

  @IsOptional()
  @IsTimeZone({ message: i18nValidationMessage('validation.IS_TIMEZONE') })
  timezone?: string;
}
