import { IsNumberString, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ScheduleUpcomingQueryDto {
  @IsOptional()
  @IsNumberString(
    {},
    { message: i18nValidationMessage('validation.IS_NUMBER_STRING') },
  )
  limit?: string;
}
