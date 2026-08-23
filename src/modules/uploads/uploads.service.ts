import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Model, Types } from 'mongoose';
import { I18nContext } from 'nestjs-i18n';
import { Readable } from 'stream';
import { StoredFile, StoredFileDocument } from './schemas/stored-file.schema';

@Injectable()
export class UploadsService {
  private readonly cloudinaryConfigured: boolean;

  constructor(
    @InjectModel(StoredFile.name)
    private readonly storedFileModel: Model<StoredFileDocument>,
    private readonly configService: ConfigService,
  ) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    this.cloudinaryConfigured = Boolean(cloudName);

    if (this.cloudinaryConfigured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        secure: true,
      });
    }
  }

  async save(data: Buffer, mimeType: string): Promise<string> {
    if (this.cloudinaryConfigured) {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              reject(
                error instanceof Error
                  ? error
                  : new Error(error?.message ?? 'Cloudinary upload failed'),
              );
              return;
            }
            resolve(uploadResult);
          },
        );
        Readable.from(data).pipe(uploadStream);
      });

      return result.secure_url;
    }

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
