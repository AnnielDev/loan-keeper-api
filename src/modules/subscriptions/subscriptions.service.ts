import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import {
  SubscriptionStatus,
  User,
  UserDocument,
} from '../auth/schemas/user.schema';
import { VerifyPurchaseDto } from './dto/verify-purchase.dto';
import { GooglePlayService } from './google-play.service';
import {
  GoogleDeveloperNotification,
  GooglePubSubPushMessage,
} from './interfaces/google-pubsub-push.interface';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private googlePlayService: GooglePlayService,
  ) {}

  async getStatus(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(
        I18nContext.current()?.t('subscriptions.USER_NOT_FOUND'),
      );
    }

    return {
      data: {
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      },
    };
  }

  async verifyPurchase(userId: string, dto: VerifyPurchaseDto) {
    const purchase = await this.googlePlayService.getSubscriptionPurchase(
      dto.purchaseToken,
      dto.productId,
    );

    const expiresAt = this.readExpiry(purchase.expiryTimeMillis);
    if (!expiresAt || expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        I18nContext.current()?.t('subscriptions.PURCHASE_NOT_ACTIVE'),
      );
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        subscriptionExpiresAt: expiresAt,
        subscriptionProductId: dto.productId,
        subscriptionPurchaseToken: dto.purchaseToken,
      },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException(
        I18nContext.current()?.t('subscriptions.USER_NOT_FOUND'),
      );
    }

    return {
      message: I18nContext.current()?.t('subscriptions.PURCHASE_VERIFIED'),
      data: user,
    };
  }

  async handleWebhookNotification(body: GooglePubSubPushMessage) {
    const encoded = body?.message?.data;
    if (!encoded) {
      return { message: 'ignored' };
    }

    let payload: GoogleDeveloperNotification;
    try {
      payload = JSON.parse(
        Buffer.from(encoded, 'base64').toString('utf8'),
      ) as GoogleDeveloperNotification;
    } catch {
      return { message: 'ignored' };
    }

    const notification = payload.subscriptionNotification;
    if (!notification) {
      return { message: 'ignored' };
    }

    const user = await this.userModel
      .findOne({ subscriptionPurchaseToken: notification.purchaseToken })
      .select('+subscriptionPurchaseToken');
    if (!user) {
      return { message: 'ignored' };
    }

    const purchase = await this.googlePlayService.getSubscriptionPurchase(
      notification.purchaseToken,
      notification.subscriptionId,
    );
    const expiresAt = this.readExpiry(purchase.expiryTimeMillis);
    const isActive = !!expiresAt && expiresAt.getTime() > Date.now();

    user.subscriptionStatus = isActive
      ? SubscriptionStatus.ACTIVE
      : SubscriptionStatus.EXPIRED;
    user.subscriptionExpiresAt = expiresAt;
    await user.save();

    return { message: 'processed' };
  }

  private readExpiry(expiryTimeMillis?: string | null) {
    return expiryTimeMillis ? new Date(Number(expiryTimeMillis)) : undefined;
  }
}
