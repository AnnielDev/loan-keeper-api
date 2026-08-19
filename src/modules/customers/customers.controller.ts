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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

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

  @Get(':id/detail')
  getDetail(
    @Param('id') id: string,
    @CurrentUser() user: { timezone?: string },
  ) {
    return this.customersService.getDetail(id, user.timezone);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
