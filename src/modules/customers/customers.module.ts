import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoansModule } from '../loans/loans.module';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer, CustomerSchema } from './schemas/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    LoansModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [MongooseModule, CustomersService],
})
export class CustomersModule {}
