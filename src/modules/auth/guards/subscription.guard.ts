import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_SUBSCRIPTION_CHECK_KEY } from '../decorators/skip-subscription-check.decorator';
import { SubscriptionStatus } from '../schemas/user.schema';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isSkipped = this.reflector.getAllAndOverride<boolean>(
      SKIP_SUBSCRIPTION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic || isSkipped) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    const isEntitled =
      !!user &&
      (user.subscriptionStatus === SubscriptionStatus.ACTIVE ||
        (user.subscriptionStatus === SubscriptionStatus.TRIALING &&
          !!user.trialEndsAt &&
          new Date(user.trialEndsAt) > new Date()));

    if (!isEntitled) {
      throw new HttpException(
        {
          code: 'SUBSCRIPTION_REQUIRED',
          message: I18nContext.current()?.t(
            'subscriptions.SUBSCRIPTION_REQUIRED',
          ),
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
