import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type StoredFileDocument = HydratedDocument<StoredFile>;

@Schema({ timestamps: true })
export class StoredFile {
  @Prop({ required: true })
  data!: Buffer;

  @Prop({ required: true })
  mimeType!: string;
}

export const StoredFileSchema = SchemaFactory.createForClass(StoredFile);
