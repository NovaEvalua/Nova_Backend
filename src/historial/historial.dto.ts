import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CrearHistorialDto {
  @IsString()
  accion: string;

  @IsString()
  descripcion: string;

  @IsString()
  usuarioId: string;

  @IsOptional()
  @IsString()
  proyectoId?: string;

  @IsOptional()
  @IsString()
  evaluacionId?: string;

  @IsOptional()
  metadatos?: any;
}

export class FiltroHistorialDto {
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsString()
  proyectoId?: string;

  @IsOptional()
  @IsString()
  evaluacionId?: string;

  @IsOptional()
  @IsString()
  accion?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  limite?: number;

  @IsOptional()
  pagina?: number;
}
