import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Language } from '../schemas/user.schema';

export class RegisterDto {
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email!: string;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(8, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  password!: string;

  @IsOptional()
  @IsEnum(Language, { message: i18nValidationMessage('validation.IS_ENUM') })
  language?: Language;
}
