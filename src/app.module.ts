import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from './modules/auth/guards/subscription.guard';
import { CustomersModule } from './modules/customers/customers.module';
import { HomeModule } from './modules/home/home.module';
import { LoansModule } from './modules/loans/loans.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';
import { envValidationSchema } from './utils/config/env.validation';
import { DatabaseModule } from './utils/database/database.module';
import { UserLanguageResolver } from './i18n/resolvers/user-language.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, 'i18n'),
        watch: true,
      },
      // The language must reflect the authenticated user's saved preference,
      // which is only known once the auth guard runs. The global i18n
      // middleware resolves before guards, so it's disabled here and
      // resolution happens in the i18n interceptor instead (runs after
      // guards, when request.user is already populated).
      disableMiddleware: true,
      resolvers: [UserLanguageResolver, AcceptLanguageResolver],
    }),
    NestScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    LoansModule,
    CustomersModule,
    SettingsModule,
    ScheduleModule,
    HomeModule,
    UploadsModule,
    UsersModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
export class AppModule {}
