import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { I18nResolver } from 'nestjs-i18n';

@Injectable()
export class UserLanguageResolver implements I18nResolver {
  resolve(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest<Request>();
    return request.user?.language;
  }
}
