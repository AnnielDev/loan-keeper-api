import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';

@Controller({})
export class AppController {
  @Public()
  @Get('/')
  index() {
    return '😎 Welcome to Loan Keeper API 😎';
  }
}
