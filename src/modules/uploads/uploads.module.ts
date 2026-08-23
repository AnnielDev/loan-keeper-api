import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoredFile, StoredFileSchema } from './schemas/stored-file.schema';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StoredFile.name, schema: StoredFileSchema },
    ]),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
