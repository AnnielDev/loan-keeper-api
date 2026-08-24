import { Controller, Delete } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  deleteMe(@CurrentUser() user: { userId: string }) {
    return this.usersService.deleteAccount(user.userId);
  }
}
