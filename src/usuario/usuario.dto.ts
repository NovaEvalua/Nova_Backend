import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  Matches,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { RolUsuario } from '../common/enums/rol-usuario.enum';

export class CrearUsuarioDto {
  @IsEmail({}, { message: 'Debe ser un email vÃ¡lido' })
  correo: string;

  @IsOptional()
  @IsString({ message: 'El documento debe ser una cadena de texto' })
  @Matches(/^[A-Za-z0-9\-\.]+$/, {
    message: 'El documento solo puede contener letras, numeros y - .',
  })
  documento?: string;

  @IsString({ message: 'La contrasena debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  contrasena: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  apellidos?: string;

  @IsOptional()
  @IsEnum(RolUsuario, {
    message: 'El rol debe ser Admin, Evaluador o Estudiante',
  })
  rol?: RolUsuario;

  @IsOptional()
  activo?: boolean;

  @IsOptional()
  @IsEnum(['ACTIVO', 'SUSPENDIDO', 'RETIRADO'] as any, {
    message: 'Estado debe ser ACTIVO, SUSPENDIDO o RETIRADO',
  })
  estado?: string;
}

export class ActualizarUsuarioDto extends PartialType(CrearUsuarioDto) {
  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email vÃ¡lido' })
  correo?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  apellidos?: string;

  @IsOptional()
  @IsEnum(RolUsuario, {
    message: 'El rol debe ser Admin, Evaluador o Estudiante',
  })
  rol?: RolUsuario;

  @IsOptional()
  activo?: boolean;

  @IsOptional()
  @IsEnum(['ACTIVO', 'SUSPENDIDO', 'RETIRADO'] as any, {
    message: 'Estado debe ser ACTIVO, SUSPENDIDO o RETIRADO',
  })
  estado?: string;
}

export class CambiarPasswordDto {
  @IsString({ message: 'La contrasena actual debe ser una cadena de texto' })
  contrasenaActual: string;

  @IsString({ message: 'La nueva contrasena debe ser una cadena de texto' })
  @MinLength(6, {
    message: 'La nueva contrasena debe tener al menos 6 caracteres',
  })
  contrasenaNueva: string;
}

export class FiltroUsuarioDto {
  @IsOptional()
  @IsEnum(RolUsuario, {
    message: 'El rol debe ser ESTUDIANTE, EVALUADOR o ADMINISTRADOR',
  })
  rol?: RolUsuario;

  @IsOptional()
  activo?: boolean;

  @IsOptional()
  @IsString({
    message: 'El tÃ©rmino de bÃºsqueda debe ser una cadena de texto',
  })
  busqueda?: string;
}
