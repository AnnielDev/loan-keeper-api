import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateLoanDto } from './dto/create-loan.dto';
import { PayInstallmentDto } from './dto/pay-installment.dto';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(@Body() dto: CreateLoanDto, @CurrentUser() user: { userId: string }) {
    return this.loansService.create(dto, user.userId);
  }

  @Get()
  findAll() {
    return this.loansService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.loansService.findByUser(userId);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.loansService.findByCustomer(customerId);
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
