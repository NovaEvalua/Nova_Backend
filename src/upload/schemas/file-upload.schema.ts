import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FileUploadDocument = FileUpload & Document;

@Schema({ timestamps: true })
export class FileUpload {
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true, unique: true })
  filename: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  mimetype: string;

  @Prop({ required: true })
  size: number;

  @Prop({ default: Date.now })
  uploadDate: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description?: string;

  @Prop()
  category?: string;

  @Prop()
  uploadedBy?: string; // ID del usuario que subió el archivo

  @Prop()
  relatedEntity?: string; // ID de la entidad relacionada (proyecto, evaluación, etc.)

  @Prop()
  relatedEntityType?: string; // Tipo de entidad relacionada (proyecto, evaluacion, usuario, etc.)
}

export const FileUploadSchema = SchemaFactory.createForClass(FileUpload);
