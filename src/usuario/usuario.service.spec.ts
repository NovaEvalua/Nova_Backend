import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Usuario } from './usuario.model';
import type {
  CrearUsuarioDto,
  ActualizarUsuarioDto,
  CambiarPasswordDto,
} from './usuario.dto';
import type { RolUsuario } from '../common/enums/rol-usuario.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  private usuarioRepository: Repository<Usuario>;

  constructor(usuarioRepository: Repository<Usuario>) {
    this.usuarioRepository = usuarioRepository;
  }

  async crear(crearUsuarioDto: CrearUsuarioDto): Promise<Usuario> {
    const usuarioExistente = await this.usuarioRepository.findOne({
      where: { email: crearUsuarioDto.email },
    });

    if (usuarioExistente) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHasheado = await bcrypt.hash(crearUsuarioDto.password, 10);

    const usuario = this.usuarioRepository.create({
      ...crearUsuarioDto,
      password: passwordHasheado,
    });

    return await this.usuarioRepository.save(usuario);
  }

  async obtenerTodos(): Promise<Usuario[]> {
    return await this.usuarioRepository.find({
      select: [
        'id',
        'email',
        'nombres',
        'apellidos',
        'rol',
        'activo',
        'fechaCreacion',
      ],
    });
  }

  async obtenerPorId(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: ['proyectosCreados', 'proyectosAsignados', 'certificados'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  async obtenerPorEmail(email: string): Promise<Usuario> {
    return await this.usuarioRepository.findOne({
      where: { email },
    });
  }

  async actualizar(
    id: string,
    actualizarUsuarioDto: ActualizarUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.obtenerPorId(id);

    Object.assign(usuario, actualizarUsuarioDto);

    return await this.usuarioRepository.save(usuario);
  }

  async eliminar(id: string): Promise<void> {
    const usuario = await this.obtenerPorId(id);
    await this.usuarioRepository.remove(usuario);
  }

  async obtenerPorRol(rol: RolUsuario): Promise<Usuario[]> {
    return await this.usuarioRepository.find({
      where: { rol, activo: true },
      select: ['id', 'email', 'nombres', 'apellidos', 'fechaCreacion'],
    });
  }

  async cambiarPassword(
    id: string,
    cambiarPasswordDto: CambiarPasswordDto,
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const passwordValido = await bcrypt.compare(
      cambiarPasswordDto.passwordActual,
      usuario.password,
    );

    if (!passwordValido) {
      throw new ConflictException('Password actual incorrecto');
    }

    usuario.password = await bcrypt.hash(cambiarPasswordDto.passwordNuevo, 10);
    await this.usuarioRepository.save(usuario);
  }
}
