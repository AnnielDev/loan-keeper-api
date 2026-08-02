import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('languages')
  getLanguages() {
    return this.settingsService.getLanguages();
  }

  @Patch('language')
  updateLanguage(
    @Body() dto: UpdateLanguageDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.settingsService.updateLanguage(user.userId, dto);
  }

  @Get('currencies')
  getCurrencies() {
    return this.settingsService.getCurrencies();
  }

  @Patch('currency')
  updateCurrency(
    @Body() dto: UpdateCurrencyDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.settingsService.updateCurrency(user.userId, dto);
  }
}
