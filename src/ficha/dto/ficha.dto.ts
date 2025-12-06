import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsArray,
  IsEnum,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export enum NivelFormacion {
  TECNICO = 'tecnico',
  TECNOLOGO = 'tecnologo',
  ESPECIALIZACION = 'especializacion',
}

export enum ModalidadFormacion {
  PRESENCIAL = 'presencial',
  VIRTUAL = 'virtual',
  MIXTA = 'mixta',
}

export enum JornadaFormacion {
  MANANA = 'manana',
  TARDE = 'tarde',
  NOCHE = 'noche',
  MIXTA = 'mixta',
}

export class CrearFichaDto {
  @ApiProperty({ description: 'Número único de la ficha' })
  @IsString({ message: 'El número debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El número es requerido' })
  numero: string;

  @ApiProperty({ description: 'Nombre de la ficha' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({ description: 'Descripción de la ficha', required: false })
  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  descripcion?: string;

  @ApiProperty({ description: 'Programa de formación' })
  @IsString({ message: 'El programa debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El programa es requerido' })
  programa: string;

  @ApiProperty({ description: 'Nivel de formación', enum: NivelFormacion })
  @IsEnum(NivelFormacion, {
    message: 'El nivel debe ser técnico, tecnólogo o especialización',
  })
  nivel: NivelFormacion;

  @ApiProperty({
    description: 'Modalidad de formación',
    enum: ModalidadFormacion,
  })
  @IsEnum(ModalidadFormacion, {
    message: 'La modalidad debe ser presencial, virtual o mixta',
  })
  modalidad: ModalidadFormacion;

  @ApiProperty({ description: 'Duración en meses' })
  @IsNumber({}, { message: 'La duración debe ser un número' })
  @Min(1, { message: 'La duración debe ser al menos 1 mes' })
  @Max(60, { message: 'La duración no puede exceder 60 meses' })
  duracionMeses: number;

  @ApiProperty({ description: 'Fecha de inicio' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser válida' })
  fechaInicio: Date;

  @ApiProperty({ description: 'Fecha de finalización' })
  @IsDateString({}, { message: 'La fecha de fin debe ser válida' })
  fechaFin: Date;

  @ApiProperty({ description: 'ID del coordinador' })
  @IsMongoId({ message: 'El ID del coordinador debe ser válido' })
  coordinadorId: Types.ObjectId;

  @ApiProperty({
    description: 'Capacidad máxima de estudiantes',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La capacidad máxima debe ser un número' })
  @Min(1, { message: 'La capacidad máxima debe ser al menos 1' })
  capacidadMaxima?: number;

  @ApiProperty({ description: 'Sede de formación', required: false })
  @IsOptional()
  @IsString({ message: 'La sede debe ser una cadena de texto' })
  sede?: string;

  @ApiProperty({
    description: 'Jornada de formación',
    enum: JornadaFormacion,
    required: false,
  })
  @IsOptional()
  @IsEnum(JornadaFormacion, {
    message: 'La jornada debe ser mañana, tarde, noche o mixta',
  })
  jornada?: JornadaFormacion;

  @ApiProperty({
    description: 'Competencias específicas y transversales',
    required: false,
  })
  @IsOptional()
  competencias?: {
    especificas: string[];
    transversales: string[];
  };

  @ApiProperty({ description: 'Resultados de aprendizaje', required: false })
  @IsOptional()
  @IsArray({ message: 'Los resultados de aprendizaje deben ser un array' })
  resultadosAprendizaje?: string[];
}

export class ActualizarFichaDto extends PartialType(CrearFichaDto) {
  @ApiProperty({ description: 'Estado activo de la ficha', required: false })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  activa?: boolean;
}

export class AsignarInstructorDto {
  @ApiProperty({ description: 'ID del instructor a asignar' })
  @IsMongoId({ message: 'El ID del instructor debe ser válido' })
  instructorId: string;
}

export class AsignarEstudianteDto {
  @ApiProperty({ description: 'ID del estudiante a asignar' })
  @IsMongoId({ message: 'El ID del estudiante debe ser válido' })
  estudianteId: string;
}

export class FiltroFichaDto {
  @ApiProperty({ description: 'Programa de formación', required: false })
  @IsOptional()
  @IsString({ message: 'El programa debe ser una cadena de texto' })
  programa?: string;

  @ApiProperty({
    description: 'Nivel de formación',
    enum: NivelFormacion,
    required: false,
  })
  @IsOptional()
  @IsEnum(NivelFormacion, {
    message: 'El nivel debe ser técnico, tecnólogo o especialización',
  })
  nivel?: NivelFormacion;

  @ApiProperty({
    description: 'Modalidad de formación',
    enum: ModalidadFormacion,
    required: false,
  })
  @IsOptional()
  @IsEnum(ModalidadFormacion, {
    message: 'La modalidad debe ser presencial, virtual o mixta',
  })
  modalidad?: ModalidadFormacion;

  @ApiProperty({ description: 'Estado activo', required: false })
  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  activa?: boolean;

  @ApiProperty({ description: 'ID del coordinador', required: false })
  @IsOptional()
  @IsMongoId({ message: 'El ID del coordinador debe ser válido' })
  coordinadorId?: Types.ObjectId;

  @ApiProperty({ description: 'Término de búsqueda', required: false })
  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  busqueda?: string;
}
