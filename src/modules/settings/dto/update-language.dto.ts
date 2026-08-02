import { IsEnum } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Language } from '../../auth/schemas/user.schema';

export class UpdateLanguageDto {
  @IsEnum(Language, { message: i18nValidationMessage('validation.IS_ENUM') })
  language!: Language;
}
