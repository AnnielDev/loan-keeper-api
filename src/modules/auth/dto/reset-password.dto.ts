import { IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ResetPasswordDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  token!: string;

  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(8, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  password!: string;
}
