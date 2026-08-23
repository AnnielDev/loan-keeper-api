import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { I18nContext } from 'nestjs-i18n';
import { Public } from '../auth/decorators/public.decorator';
import { UploadsService } from './uploads.service';

const ALLOWED_MIME_TYPES = /^image\/(jpe?g|png|webp|heic|heif)$/i;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        callback(null, ALLOWED_MIME_TYPES.test(file.mimetype));
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException(
        I18nContext.current()?.t('uploads.FILE_REQUIRED'),
      );
    }

    const id = await this.uploadsService.save(file.buffer, file.mimetype);
    const url = `${req.protocol}://${req.get('host')}/uploads/${id}`;
    return {
      message: I18nContext.current()?.t('uploads.UPLOAD_SUCCESS'),
      data: { url },
    };
  }

  @Public()
  @Get(':id')
  async getFile(@Param('id') id: string, @Res() res: Response) {
    const file = await this.uploadsService.findById(id);
    res.set('Content-Type', file.mimeType);
    res.send(file.data);
  }
}
