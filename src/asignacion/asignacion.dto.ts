import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export enum EstadoAsignacion {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  COMPLETADA = 'COMPLETADA',
}

export class CrearAsignacionDto {
  @IsMongoId({ message: 'El ID del proyecto debe ser un ObjectId válido' })
  proyectoId: string;

  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId válido' })
  evaluadorId: string;

  @IsMongoId({ message: 'El ID del estudiante debe ser un ObjectId válido' })
  estudianteId: string;

  @IsOptional()
  @IsEnum(EstadoAsignacion, {
    message: 'El estado debe ser PENDIENTE, EN_PROCESO o COMPLETADA',
  })
  estado?: EstadoAsignacion;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
  observaciones?: string;

  @IsOptional()
  @IsMongoId({ message: 'El ID de la evaluación debe ser un ObjectId válido' })
  evaluacionId?: string;
}

export class ActualizarAsignacionDto extends PartialType(CrearAsignacionDto) {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de completado debe ser una fecha válida' },
  )
  fechaCompletado?: Date;
}

export class AsignarProyectoDto {
  @IsMongoId({ message: 'El ID del proyecto debe ser un ObjectId válido' })
  proyectoId: string;

  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId válido' })
  evaluadorId: string;

  @IsMongoId({ message: 'El ID del estudiante debe ser un ObjectId válido' })
  estudianteId: string;
}

export class AsignarProyectoFichaDto {
  @IsMongoId({ message: 'El ID del proyecto debe ser un ObjectId válido' })
  proyectoId: string;

  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId válido' })
  evaluadorId: string;

  @IsMongoId({ message: 'El ID de la ficha debe ser un ObjectId válido' })
  fichaId: string;
}

export class CompletarAsignacionDto {
  @IsOptional()
  @IsMongoId({ message: 'El ID de la evaluación debe ser un ObjectId válido' })
  evaluacionId?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
  observaciones?: string;
}

export class FiltroAsignacionDto {
  @IsOptional()
  @IsMongoId({ message: 'El ID del proyecto debe ser un ObjectId válido' })
  proyectoId?: string;

  @IsOptional()
  @IsMongoId({ message: 'El ID del evaluador debe ser un ObjectId válido' })
  evaluadorId?: string;

  @IsOptional()
  @IsMongoId({ message: 'El ID del estudiante debe ser un ObjectId válido' })
  estudianteId?: string;

  @IsOptional()
  @IsEnum(EstadoAsignacion, {
    message: 'El estado debe ser PENDIENTE, EN_PROCESO o COMPLETADA',
  })
  estado?: EstadoAsignacion;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  fechaInicio?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  fechaFin?: Date;
}
