import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { UpdateLanguageDto } from './dto/update-language.dto';

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
    return user;
  }
}
