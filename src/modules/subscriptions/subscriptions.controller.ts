import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SkipSubscriptionCheck } from '../auth/decorators/skip-subscription-check.decorator';
import { VerifyPurchaseDto } from './dto/verify-purchase.dto';
import type { GooglePubSubPushMessage } from './interfaces/google-pubsub-push.interface';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @SkipSubscriptionCheck()
  @Get('status')
  getStatus(@CurrentUser() user: { userId: string }) {
    return this.subscriptionsService.getStatus(user.userId);
  }

  @SkipSubscriptionCheck()
  @HttpCode(HttpStatus.OK)
  @Post('verify-purchase')
  verifyPurchase(
    @Body() dto: VerifyPurchaseDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.subscriptionsService.verifyPurchase(user.userId, dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('webhooks/google')
  handleGoogleWebhook(@Body() body: GooglePubSubPushMessage) {
    return this.subscriptionsService.handleWebhookNotification(body);
  }
}
