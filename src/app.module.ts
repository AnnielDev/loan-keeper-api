import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HomeModule } from './modules/home/home.module';
import { LoansModule } from './modules/loans/loans.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { SettingsModule } from './modules/settings/settings.module';
import { envValidationSchema } from './utils/config/env.validation';
import { DatabaseModule } from './utils/database/database.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    AuthModule,
    LoansModule,
    CustomersModule,
    SettingsModule,
    ScheduleModule,
    HomeModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
