import { IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class GoogleSignInDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  idToken!: string;
}
