import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { GooglePlayService } from './google-play.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsCronService } from './subscriptions.cron.service';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    GooglePlayService,
    SubscriptionsCronService,
  ],
})
export class SubscriptionsModule {}
