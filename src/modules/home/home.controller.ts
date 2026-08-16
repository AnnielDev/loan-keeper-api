import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HomeService } from './home.service';

@Controller()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: { timezone?: string; balance?: number }) {
    return this.homeService.getDashboard(user.timezone, user.balance);
  }
}
