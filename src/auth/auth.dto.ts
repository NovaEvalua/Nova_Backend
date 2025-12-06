import {
  IsEmail,
  IsString,
  IsEnum,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { RolUsuario } from '../common/enums/rol-usuario.enum';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  usuario: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Transform(
    ({ obj, value }) => value ?? obj?.['contraseña'] ?? obj?.contrasena,
  )
  contrasena: string;

  @IsEnum(RolUsuario)
  @IsNotEmpty()
  rol: RolUsuario;
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  @Transform(
    ({ obj, value }) => value ?? obj?.['contraseña'] ?? obj?.contrasena,
  )
  contrasena: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  nombre: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  apellidos?: string;

  @IsEnum(RolUsuario)
  rol: RolUsuario;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  contrasenaActual: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  contrasenaNueva: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  correo: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(50)
  contrasenaNueva: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
