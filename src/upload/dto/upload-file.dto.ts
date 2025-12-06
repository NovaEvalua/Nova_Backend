import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FileCategory {
  PROYECTO = 'proyecto',
  EVALUACION = 'evaluacion',
  USUARIO = 'usuario',
  DOCUMENTO = 'documento',
  IMAGEN = 'imagen',
  OTRO = 'otro',
}

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Archivo a subir',
  })
  file: any;

  @ApiProperty({
    description: 'Descripción del archivo',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Categoría del archivo',
    enum: FileCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiProperty({
    description: 'ID de la entidad relacionada',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedEntity?: string;

  @ApiProperty({
    description: 'Tipo de entidad relacionada',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;
}

export class UploadMultipleFilesDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Archivos a subir',
  })
  files: any[];

  @ApiProperty({
    description: 'Descripción de los archivos',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Categoría de los archivos',
    enum: FileCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiProperty({
    description: 'ID de la entidad relacionada',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedEntity?: string;

  @ApiProperty({
    description: 'Tipo de entidad relacionada',
    required: false,
  })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;
}
