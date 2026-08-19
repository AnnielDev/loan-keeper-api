import { IsBooleanString, IsNumberString, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ScheduleEventsQueryDto {
  @IsNumberString(
    {},
    { message: i18nValidationMessage('validation.IS_NUMBER_STRING') },
  )
  month!: string;

  @IsNumberString(
    {},
    { message: i18nValidationMessage('validation.IS_NUMBER_STRING') },
  )
  year!: string;

  @IsOptional()
  @IsBooleanString({
    message: i18nValidationMessage('validation.IS_BOOLEAN_STRING'),
  })
  includePaid?: string;
}
