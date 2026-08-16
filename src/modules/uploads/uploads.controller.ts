import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { I18nContext } from 'nestjs-i18n';
import { extname } from 'path';

const ALLOWED_MIME_TYPES = /^image\/(jpe?g|png|webp|heic|heif)$/i;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('uploads')
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          callback(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        callback(null, ALLOWED_MIME_TYPES.test(file.mimetype));
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException(
        I18nContext.current()?.t('uploads.FILE_REQUIRED'),
      );
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    return {
      message: I18nContext.current()?.t('uploads.UPLOAD_SUCCESS'),
      data: { url },
    };
  }
}
