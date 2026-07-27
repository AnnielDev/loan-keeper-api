import { Controller, Get } from '@nestjs/common';

@Controller({})
export class HomeController {
  @Get('/dashboard')
  getDashboard() {
    return 'Dashboard data';
  }
}
