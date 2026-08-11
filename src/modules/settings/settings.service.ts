import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { CURRENCIES } from './currencies';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LANGUAGES } from './languages';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async updateLanguage(userId: string, dto: UpdateLanguageDto) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { language: dto.language },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException(
        I18nContext.current()?.t('settings.USER_NOT_FOUND'),
      );
    }
    return {
      message: I18nContext.current()?.t('settings.LANGUAGE_UPDATED'),
      data: user,
    };
  }

  async updateCurrency(userId: string, dto: UpdateCurrencyDto) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { currency: dto.currency },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException(
        I18nContext.current()?.t('settings.USER_NOT_FOUND'),
      );
    }
    return {
      message: I18nContext.current()?.t('settings.CURRENCY_UPDATED'),
      data: user,
    };
  }

  async updateLocation(userId: string, dto: UpdateLocationDto) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { country: dto.country, timezone: dto.timezone },
      { new: true },
    );
    if (!user) {
      throw new NotFoundException(
        I18nContext.current()?.t('settings.USER_NOT_FOUND'),
      );
    }
    return {
      message: I18nContext.current()?.t('settings.LOCATION_UPDATED'),
      data: user,
    };
  }

  getCurrencies() {
    return CURRENCIES;
  }

  getLanguages() {
    return LANGUAGES;
  }
}
