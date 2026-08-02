import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/customers.module';
import { LoansModule } from '../loans/loans.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [CustomersModule, LoansModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
