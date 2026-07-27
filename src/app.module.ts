import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { CustomersModule } from './customers/customers.module';
import { HomeModule } from './home/home.module';
import { LoansModule } from './loans/loans.module';
import { ScheduleModule } from './schedule/schedule.module';
import { SettingsModule } from './settings/settings.module';
@Module({
  imports: [
    LoansModule,
    CustomersModule,
    SettingsModule,
    ScheduleModule,
    HomeModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
