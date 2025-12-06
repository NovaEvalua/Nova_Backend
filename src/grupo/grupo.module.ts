import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Grupo, GrupoSchema } from './grupo.model';
import { GrupoService } from './grupo.service';
import { GrupoController } from './grupo.controller';
import {
  FileUpload,
  FileUploadSchema,
} from '../upload/schemas/file-upload.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Grupo.name, schema: GrupoSchema },
      { name: FileUpload.name, schema: FileUploadSchema },
    ]),
  ],
  controllers: [GrupoController],
  providers: [GrupoService],
  exports: [GrupoService],
})
export class GrupoModule {}
