import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
  Min,
  Max,
  Length,
  IsNotEmpty,
} from 'class-validator';
import { Transform as ClassTransform } from 'class-transformer';

export class CrearCalificacionDto {
  @IsMongoId({ message: 'El ID de evaluación debe ser un ObjectId válido' })
  @IsNotEmpty({ message: 'El ID de evaluación es obligatorio' })
  evaluacionId: string;

  @IsString({ message: 'El criterio debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El criterio es obligatorio' })
  @Length(3, 100, {
    message: 'El criterio debe tener entre 3 y 100 caracteres',
  })
  @ClassTransform(({ value }) => value?.trim())
  criterio: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El puntaje debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El puntaje no puede ser negativo' })
  @Max(1000, { message: 'El puntaje no puede ser mayor a 1000' })
  puntaje: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El puntaje máximo debe ser un número con máximo 2 decimales' },
  )
  @Min(0.01, { message: 'El puntaje máximo debe ser mayor a 0' })
  @Max(1000, { message: 'El puntaje máximo no puede ser mayor a 1000' })
  puntajeMaximo: number;

  @IsOptional()
  @IsString({ message: 'Los comentarios deben ser una cadena de texto' })
  @Length(0, 1000, {
    message: 'Los comentarios no pueden exceder 1000 caracteres',
  })
  @ClassTransform(({ value }) => value?.trim())
  comentarios?: string;
}

export class ActualizarCalificacionDto {
  @IsOptional()
  @IsString({ message: 'El criterio debe ser una cadena de texto' })
  @Length(3, 100, {
    message: 'El criterio debe tener entre 3 y 100 caracteres',
  })
  @ClassTransform(({ value }) => value?.trim())
  criterio?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El puntaje debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El puntaje no puede ser negativo' })
  @Max(1000, { message: 'El puntaje no puede ser mayor a 1000' })
  puntaje?: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El puntaje máximo debe ser un número con máximo 2 decimales' },
  )
  @Min(0.01, { message: 'El puntaje máximo debe ser mayor a 0' })
  @Max(1000, { message: 'El puntaje máximo no puede ser mayor a 1000' })
  puntajeMaximo?: number;

  @IsOptional()
  @IsString({ message: 'Los comentarios deben ser una cadena de texto' })
  @Length(0, 1000, {
    message: 'Los comentarios no pueden exceder 1000 caracteres',
  })
  @ClassTransform(({ value }) => value?.trim())
  comentarios?: string;
}

export class FiltroCalificacionDto {
  @IsOptional()
  @IsMongoId({ message: 'El ID de evaluación debe ser un ObjectId válido' })
  evaluacionId?: string;

  @IsOptional()
  @IsMongoId({ message: 'El ID de calificador debe ser un ObjectId válido' })
  calificadoPorId?: string;

  @IsOptional()
  @IsString({ message: 'El criterio debe ser una cadena de texto' })
  @ClassTransform(({ value }) => value?.trim())
  criterio?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El puntaje mínimo debe ser un número' })
  @Min(0, { message: 'El puntaje mínimo no puede ser negativo' })
  puntajeMinimo?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El puntaje máximo debe ser un número' })
  @Min(0, { message: 'El puntaje máximo no puede ser negativo' })
  puntajeMaximo?: number;
}

export class CalificacionMasivaDto {
  @IsMongoId({ message: 'El ID de evaluación debe ser un ObjectId válido' })
  @IsNotEmpty({ message: 'El ID de evaluación es obligatorio' })
  evaluacionId: string;

  @IsNotEmpty({ message: 'Las calificaciones son obligatorias' })
  calificaciones: {
    criterio: string;
    puntaje: number;
    puntajeMaximo: number;
    comentarios?: string;
  }[];
}

export class EstadisticasCalificacionDto {
  @IsMongoId({ message: 'El ID de evaluación debe ser un ObjectId válido' })
  @IsNotEmpty({ message: 'El ID de evaluación es obligatorio' })
  evaluacionId: string;
}
