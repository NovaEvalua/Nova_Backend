import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsMongoId,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum EstadoCertificado {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  VENCIDO = 'VENCIDO',
}

export class CrearCertificadoDto {
  @ApiProperty({
    description: 'ID del estudiante que recibe el certificado',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'El ID del estudiante es obligatorio' })
  @IsMongoId({ message: 'El ID del estudiante debe ser un ObjectId válido' })
  estudianteId: string;

  @ApiProperty({
    description: 'ID de la evaluación asociada al certificado',
    example: '507f1f77bcf86cd799439012',
  })
  @IsNotEmpty({ message: 'El ID de la evaluación es obligatorio' })
  @IsMongoId({ message: 'El ID de la evaluación debe ser un ObjectId válido' })
  evaluacionId: string;

  @ApiPropertyOptional({
    description: 'Descripción del certificado',
    example: 'Certificado de finalización del curso de JavaScript Avanzado',
  })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @Length(10, 500, {
    message: 'La descripción debe tener entre 10 y 500 caracteres',
  })
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Institución que emite el certificado',
    example: 'Universidad Tecnológica',
  })
  @IsOptional()
  @IsString({ message: 'La institución debe ser una cadena de texto' })
  @Length(2, 100, {
    message: 'La institución debe tener entre 2 y 100 caracteres',
  })
  institucion?: string;

  @ApiPropertyOptional({
    description: 'Calificación final obtenida',
    example: 85.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La calificación final debe ser un número' })
  @Min(0, { message: 'La calificación final no puede ser menor a 0' })
  @Max(100, { message: 'La calificación final no puede ser mayor a 100' })
  @Transform(({ value }) => parseFloat(value))
  calificacionFinal?: number;

  @ApiPropertyOptional({
    description: 'Fecha de vencimiento del certificado',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de vencimiento debe ser una fecha válida' },
  )
  fechaVencimiento?: Date;

  @ApiPropertyOptional({
    description: 'Estado del certificado',
    enum: EstadoCertificado,
    example: EstadoCertificado.ACTIVO,
  })
  @IsOptional()
  @IsEnum(EstadoCertificado, {
    message: 'El estado debe ser ACTIVO, INACTIVO o VENCIDO',
  })
  estado?: EstadoCertificado;
}

export class ActualizarCertificadoDto extends PartialType(CrearCertificadoDto) {
  @ApiPropertyOptional({
    description: 'Número de certificado (solo lectura)',
    example: 'CERT-1640995200000-123',
  })
  @IsOptional()
  @IsString({
    message: 'El número de certificado debe ser una cadena de texto',
  })
  numeroCertificado?: string;
}

export class FiltroCertificadoDto {
  @ApiPropertyOptional({
    description: 'ID del estudiante para filtrar certificados',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del estudiante debe ser un ObjectId válido' })
  estudianteId?: string;

  @ApiPropertyOptional({
    description: 'ID de la evaluación para filtrar certificados',
    example: '507f1f77bcf86cd799439012',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID de la evaluación debe ser un ObjectId válido' })
  evaluacionId?: string;

  @ApiPropertyOptional({
    description: 'Estado del certificado para filtrar',
    enum: EstadoCertificado,
    example: EstadoCertificado.ACTIVO,
  })
  @IsOptional()
  @IsEnum(EstadoCertificado, {
    message: 'El estado debe ser ACTIVO, INACTIVO o VENCIDO',
  })
  estado?: EstadoCertificado;

  @ApiPropertyOptional({
    description: 'Institución para filtrar certificados',
    example: 'Universidad Tecnológica',
  })
  @IsOptional()
  @IsString({ message: 'La institución debe ser una cadena de texto' })
  institucion?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio para filtrar por rango de emisión',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  fechaInicio?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de fin para filtrar por rango de emisión',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  fechaFin?: Date;
}

export class CambiarEstadoCertificadoDto {
  @ApiProperty({
    description: 'Nuevo estado del certificado',
    enum: EstadoCertificado,
    example: EstadoCertificado.INACTIVO,
  })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(EstadoCertificado, {
    message: 'El estado debe ser ACTIVO, INACTIVO o VENCIDO',
  })
  estado: EstadoCertificado;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de estado',
    example: 'Certificado revocado por incumplimiento',
  })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @Length(5, 200, { message: 'El motivo debe tener entre 5 y 200 caracteres' })
  motivo?: string;
}

export class VerificarCertificadoDto {
  @ApiProperty({
    description: 'Número de certificado a verificar',
    example: 'CERT-1640995200000-123',
  })
  @IsNotEmpty({ message: 'El número de certificado es obligatorio' })
  @IsString({
    message: 'El número de certificado debe ser una cadena de texto',
  })
  @Length(5, 50, {
    message: 'El número de certificado debe tener entre 5 y 50 caracteres',
  })
  numeroCertificado: string;
}

export class EstadisticasCertificadoDto {
  @ApiPropertyOptional({
    description: 'Fecha de inicio para las estadísticas',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  fechaInicio?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de fin para las estadísticas',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  fechaFin?: Date;

  @ApiPropertyOptional({
    description: 'Agrupar estadísticas por institución',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  agruparPorInstitucion?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir certificados vencidos en las estadísticas',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  incluirVencidos?: boolean;
}
