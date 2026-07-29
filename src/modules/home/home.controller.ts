import { Controller, Get } from '@nestjs/common';
// import { Request, Response } from 'express';

@Controller({})
export class HomeController {
  @Get('/dashboard')
  getDashboard() {
    return 'Dashboard data';
  }
}
