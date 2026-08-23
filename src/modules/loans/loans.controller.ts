import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ListLoansQueryDto } from './dto/list-loans-query.dto';
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
  findAll(
    @Query() query: ListLoansQueryDto,
    @CurrentUser() user: { timezone?: string },
  ) {
    return this.loansService.findAll(query, user.timezone);
  }

  @Get('mine')
  findMine(
    @Query() query: ListLoansQueryDto,
    @CurrentUser() user: { userId: string; timezone?: string },
  ) {
    return this.loansService.findMine(query, user.userId, user.timezone);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.loansService.findByUser(userId);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.loansService.findByCustomer(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { timezone?: string }) {
    return this.loansService.getDetail(id, user.timezone);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loansService.remove(id);
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
