import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsString,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';
import { TipoReporte, FormatoArchivo } from './reporte.model';
import { Types } from 'mongoose';

export class CrearReporteDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsNotEmpty()
  @IsEnum(TipoReporte)
  tipo: TipoReporte;

  @IsNotEmpty()
  @IsObject()
  parametros: any;

  @IsNotEmpty()
  creadoPorId: Types.ObjectId;

  @IsOptional()
  @IsEnum(FormatoArchivo)
  formatoArchivo?: FormatoArchivo;
}

export class FiltroReporteDto {
  @IsOptional()
  @IsDateString()
  fechaInicio?: Date;

  @IsOptional()
  @IsDateString()
  fechaFin?: Date;

  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;
}
