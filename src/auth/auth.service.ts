import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';
import type { UsuarioDocument } from '../usuario/usuario.model';
import type {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './auth.dto';
import type { JwtPayload, LoginResponse } from './auth.model';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    // Buscar usuario por correo o nombre de usuario, tolerando no encontrados
    let usuario: UsuarioDocument | null = null;
    try {
      usuario = (await this.usuarioService.obtenerPorCorreo(
        (loginDto.usuario || '').toLowerCase().trim(),
      )) as UsuarioDocument;
    } catch {}
    if (!usuario) {
      try {
        usuario = (await this.usuarioService.obtenerPorNombre(
          (loginDto.usuario || '').trim(),
        )) as UsuarioDocument;
      } catch {}
    }

    if (!usuario) {
      throw new UnauthorizedException('Credenciales invÃ¡lidas');
    }

    const hash = (usuario as any).contrasena || (usuario as any)['contraseña'];
    // Buscar el hash de contraseña en el documento, tolerando claves con codificación extraña
    let hashValue = hash as string;
    if (!hashValue) {
      const raw: any =
        typeof (usuario as any).toObject === 'function'
          ? (usuario as any).toObject()
          : (usuario as any);
      const key = Object.keys(raw).find((k) =>
        k.toLowerCase().startsWith('contras'),
      );
      if (key) hashValue = raw[key];
    }
    if (!loginDto.contrasena || !hashValue) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const passwordValido = await bcrypt.compare(loginDto.contrasena, hashValue);

    if (!usuario || !passwordValido || usuario.rol !== loginDto.rol) {
      throw new UnauthorizedException('Credenciales invÃ¡lidas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const payload: JwtPayload = {
      sub: (usuario._id as any).toString(),
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: (usuario._id as any).toString(),
        correo: usuario.correo,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        rol: usuario.rol,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<LoginResponse> {
    const usuario = (await this.usuarioService.crear(
      registerDto as any,
    )) as UsuarioDocument;

    const payload: JwtPayload = {
      sub: (usuario._id as any).toString(),
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: (usuario._id as any).toString(),
        correo: usuario.correo,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        rol: usuario.rol,
      },
    };
  }

  async validateUser(payload: JwtPayload) {
    return await this.usuarioService.obtenerPorId(payload.sub);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // Silencioso si no existe el correo para no filtrar usuarios
    let usuario: UsuarioDocument | null = null;
    try {
      usuario = (await this.usuarioService.obtenerPorCorreo(
        dto.correo.toLowerCase().trim(),
      )) as any;
    } catch {
      usuario = null;
    }
    if (!usuario) {
      return {
        message: 'Si el correo existe, se enviara un enlace de recuperacion',
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const exp = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    const correo = usuario.correo;
    await this.usuarioService.asignarTokenReset(correo, token, exp);

    const base =
      process.env.APP_RESET_URL ||
      (process.env.FRONTEND_URL
        ? `${process.env.FRONTEND_URL.replace(/\/+$/, '')}/restablecer-contrasena`
        : 'http://localhost:5173/restablecer-contrasena');
    const resetLink = `${base}?token=${token}`;

    // Enviar por correo real: aqui podríamos integrar un servicio SMTP.
    // Mientras tanto, dejamos el enlace en consola para pruebas.
    console.log(`[RECUPERACION] Enlace de reset para ${correo}: ${resetLink}`);

    return {
      message: 'Si el correo existe, se enviara un enlace de recuperacion',
      resetLink, // util para pruebas locales
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const token = dto.token;
    if (!token) throw new BadRequestException('Token requerido');
    await this.usuarioService.actualizarPasswordPorToken(
      token,
      dto.contrasenaNueva,
    );
    return { message: 'Contraseña actualizada correctamente' };
  }
}
