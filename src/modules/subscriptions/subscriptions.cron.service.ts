import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  SubscriptionStatus,
  User,
  UserDocument,
} from '../auth/schemas/user.schema';
import { GooglePlayService } from './google-play.service';

// Safety net alongside the RTDN webhook (subscriptions.controller.ts):
// flips lapsed trials to 'expired', and re-checks 'active' users whose
// stored expiry has passed in case a renewal notification was missed.
@Injectable()
export class SubscriptionsCronService {
  private readonly logger = new Logger(SubscriptionsCronService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private googlePlayService: GooglePlayService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async sweepExpiredSubscriptions() {
    await this.userModel.updateMany(
      {
        subscriptionStatus: SubscriptionStatus.TRIALING,
        trialEndsAt: { $lt: new Date() },
      },
      { subscriptionStatus: SubscriptionStatus.EXPIRED },
    );

    const staleActiveUsers = await this.userModel
      .find({
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: { $lt: new Date() },
      })
      .select('+subscriptionPurchaseToken');

    for (const user of staleActiveUsers) {
      await this.refreshOrExpire(user);
    }
  }

  private async refreshOrExpire(user: UserDocument) {
    if (!user.subscriptionPurchaseToken || !user.subscriptionProductId) {
      user.subscriptionStatus = SubscriptionStatus.EXPIRED;
      await user.save();
      return;
    }

    try {
      const purchase = await this.googlePlayService.getSubscriptionPurchase(
        user.subscriptionPurchaseToken,
        user.subscriptionProductId,
      );
      const expiryTimeMillis = purchase.expiryTimeMillis
        ? Number(purchase.expiryTimeMillis)
        : undefined;
      const isActive = !!expiryTimeMillis && expiryTimeMillis > Date.now();

      user.subscriptionStatus = isActive
        ? SubscriptionStatus.ACTIVE
        : SubscriptionStatus.EXPIRED;
      user.subscriptionExpiresAt = expiryTimeMillis
        ? new Date(expiryTimeMillis)
        : undefined;
      await user.save();
    } catch (error) {
      this.logger.warn(
        `Failed to re-verify Google Play subscription for user ${user.id}: ${
          (error as Error).message
        }`,
      );
      user.subscriptionStatus = SubscriptionStatus.EXPIRED;
      await user.save();
    }
  }
}
