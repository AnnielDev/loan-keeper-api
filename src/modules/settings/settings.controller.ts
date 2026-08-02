import { Body, Controller, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Patch('language')
  updateLanguage(
    @Body() dto: UpdateLanguageDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.settingsService.updateLanguage(user.userId, dto);
  }
}
