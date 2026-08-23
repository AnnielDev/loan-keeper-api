import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { StoredFile, StoredFileDocument } from './schemas/stored-file.schema';

@Injectable()
export class UploadsService {
  constructor(
    @InjectModel(StoredFile.name)
    private readonly storedFileModel: Model<StoredFileDocument>,
  ) {}

  async save(data: Buffer, mimeType: string): Promise<string> {
    const file = await this.storedFileModel.create({ data, mimeType });
    return file._id.toString();
  }

  async findById(id: string): Promise<StoredFileDocument> {
    const file = Types.ObjectId.isValid(id)
      ? await this.storedFileModel.findById(id)
      : null;

    if (!file) {
      throw new NotFoundException(
        I18nContext.current()?.t('uploads.FILE_NOT_FOUND'),
      );
    }

    return file;
  }
}
