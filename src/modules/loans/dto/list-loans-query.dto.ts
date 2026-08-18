import { IsIn, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export type LoanStatusFilter = 'all' | 'active' | 'overdue' | 'paid';

export class ListLoansQueryDto {
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  search?: string;

  @IsOptional()
  @IsIn(['all', 'active', 'overdue', 'paid'], {
    message: i18nValidationMessage('validation.IS_ENUM'),
  })
  status?: LoanStatusFilter;
}
