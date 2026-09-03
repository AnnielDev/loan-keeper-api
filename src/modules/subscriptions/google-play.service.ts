import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { androidpublisher_v3, google } from 'googleapis';

@Injectable()
export class GooglePlayService {
  private readonly androidPublisher: androidpublisher_v3.Androidpublisher;
  private readonly packageName: string;

  constructor(private configService: ConfigService) {
    this.packageName =
      this.configService.get<string>('GOOGLE_PLAY_PACKAGE_NAME') ?? '';

    const auth = new google.auth.JWT({
      email: this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      key: this.decodePrivateKey(),
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    this.androidPublisher = google.androidpublisher({ version: 'v3', auth });
  }

  private decodePrivateKey() {
    const raw = this.configService.get<string>(
      'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
    );
    return raw ? Buffer.from(raw, 'base64').toString('utf8') : undefined;
  }

  async getSubscriptionPurchase(purchaseToken: string, productId: string) {
    const { data } = await this.androidPublisher.purchases.subscriptions.get({
      packageName: this.packageName,
      subscriptionId: productId,
      token: purchaseToken,
    });
    return data;
  }
}
