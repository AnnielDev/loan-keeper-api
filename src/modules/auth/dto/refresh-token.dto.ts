import { IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RefreshTokenDto {
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  refreshToken!: string;
}
