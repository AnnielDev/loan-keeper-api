import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.customersService.create(dto, user.userId);
  }

  @Get()
  findAll(
    @Query() query: ListCustomersQueryDto,
    @CurrentUser() user: { timezone?: string },
  ) {
    return this.customersService.findAll(query, user.timezone);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.customersService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }
}
