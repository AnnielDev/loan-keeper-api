import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export type CustomerStatusFilter = 'all' | 'active' | 'overdue';

export class ListCustomersQueryDto {
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  search?: string;

  @IsOptional()
  @IsIn(['all', 'active', 'overdue'], {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: CustomerStatusFilter;

  @IsOptional()
  @IsNumberString(
    {},
    { message: i18nValidationMessage('validation.IS_NUMBER_STRING') },
  )
  page?: string;

  @IsOptional()
  @IsNumberString(
    {},
    { message: i18nValidationMessage('validation.IS_NUMBER_STRING') },
  )
  limit?: string;
}
