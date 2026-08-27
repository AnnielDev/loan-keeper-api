import { IsEmail, IsNumberString, Length } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class VerifyEmailDto {
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email!: string;

  @IsNumberString(
    {},
    { message: i18nValidationMessage('validation.IS_NUMBER_STRING') },
  )
  @Length(6, 6, { message: i18nValidationMessage('validation.EXACT_LENGTH') })
  code!: string;
}
