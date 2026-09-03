import { Controller, Delete } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SkipSubscriptionCheck } from '../auth/decorators/skip-subscription-check.decorator';
import { UsersService } from './users.service';

@Controller('users')
@SkipSubscriptionCheck()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  deleteMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.deleteAccount(user.userId);
  }
}
