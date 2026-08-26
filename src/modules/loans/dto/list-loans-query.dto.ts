import { IsIn, IsNumberString, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export type LoanStatusFilter = 'all' | 'active' | 'overdue' | 'paid';
export type LoanOriginFilter = 'all' | 'new' | 'legacy';

export class ListLoansQueryDto {
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  search?: string;

  @IsOptional()
  @IsIn(['all', 'active', 'overdue', 'paid'], {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: LoanStatusFilter;

  @IsOptional()
  @IsIn(['all', 'new', 'legacy'], {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  origin?: LoanOriginFilter;

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
