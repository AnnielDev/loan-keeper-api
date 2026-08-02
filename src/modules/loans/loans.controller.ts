import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateLoanDto } from './dto/create-loan.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(@Body() dto: CreateLoanDto) {
    return this.loansService.create(dto);
  }

  @Get()
  findAll() {
    return this.loansService.findAll();
  }

  @Patch(':loanId/installments/:installmentId/pay')
  payInstallment(
    @Param('loanId') loanId: string,
    @Param('installmentId') installmentId: string,
    @Body() dto: PayInstallmentDto,
  ) {
    return this.loansService.payInstallment(loanId, installmentId, dto);
  }
}
