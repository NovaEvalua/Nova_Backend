import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Types } from 'mongoose';
import { TipoNotificacion } from './notificacion.model';

export class CrearNotificacionDto {
  @IsString()
  titulo: string;

  @IsString()
  mensaje: string;

  @IsString()
  usuarioId: string;

  @IsOptional()
  @IsEnum(TipoNotificacion)
  tipo?: TipoNotificacion;

  @IsOptional()
  @IsString()
  enlace?: string;

  @IsOptional()
  metadatos?: any;
}

export class FiltroNotificacionDto {
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @IsOptional()
  @IsEnum(TipoNotificacion)
  tipo?: TipoNotificacion;

  @IsOptional()
  @IsBoolean()
  leida?: boolean;

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

export class ActualizarNotificacionDto {
  @IsOptional()
  @IsBoolean()
  leida?: boolean;

  @IsOptional()
  fechaLeida?: Date;
}
