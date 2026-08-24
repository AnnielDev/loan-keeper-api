import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateNameDto } from './dto/update-name.dto';
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

  @Public()
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

  @Patch('location')
  updateLocation(
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.settingsService.updateLocation(user.userId, dto);
  }

  @Patch('name')
  updateName(
    @Body() dto: UpdateNameDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.settingsService.updateName(user.userId, dto);
  }
}
