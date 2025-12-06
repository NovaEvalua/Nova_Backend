import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario, UsuarioDocument } from './usuario.model';
import { Ficha, FichaDocument } from '../ficha/schemas/ficha.schema';
import {
  CrearUsuarioDto,
  ActualizarUsuarioDto,
  CambiarPasswordDto,
} from './usuario.dto';
import { RolUsuario } from '../common/enums/rol-usuario.enum';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    @InjectModel(Ficha.name) private fichaModel: Model<FichaDocument>,
  ) {}

  async crear(crearUsuarioDto: CrearUsuarioDto): Promise<Usuario> {
    try {
      if (!crearUsuarioDto.nombre || crearUsuarioDto.nombre.trim().length < 2) {
        throw new BadRequestException(
          'El nombre debe tener al menos 2 caracteres',
        );
      }
      if (
        !crearUsuarioDto.apellidos ||
        crearUsuarioDto.apellidos.trim().length < 2
      ) {
        throw new BadRequestException(
          'Los apellidos deben tener al menos 2 caracteres',
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!crearUsuarioDto.correo || !emailRegex.test(crearUsuarioDto.correo)) {
        throw new BadRequestException(
          'El formato del correo electronico es invalido',
        );
      }

      const plain =
        (crearUsuarioDto as any).contrasena ||
        (crearUsuarioDto as any)['contraseña'];
      if (!plain || String(plain).length < 6) {
        throw new BadRequestException(
          'La contrasena debe tener al menos 6 caracteres',
        );
      }
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
      if (!passwordRegex.test(String(plain))) {
        throw new BadRequestException(
          'La contrasena debe contener al menos una letra y un numero',
        );
      }

      const rolesValidos = Object.values(RolUsuario);
      if (!crearUsuarioDto.rol || !rolesValidos.includes(crearUsuarioDto.rol)) {
        throw new BadRequestException('El rol especificado no es valido');
      }

      const usuarioExistente = await this.usuarioModel.findOne({
        correo: crearUsuarioDto.correo.toLowerCase().trim(),
      });
      if (usuarioExistente) {
        throw new ConflictException('El correo ya esta registrado');
      }

      const usuarioMismoNombre = await this.usuarioModel.findOne({
        nombre: crearUsuarioDto.nombre.trim(),
        apellidos: crearUsuarioDto.apellidos.trim(),
      });
      if (usuarioMismoNombre) {
        throw new ConflictException(
          'Ya existe un usuario con el mismo nombre y apellidos',
        );
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(String(plain), saltRounds);

      const nuevoUsuario = new this.usuarioModel({
        ...(crearUsuarioDto as any),
        nombre: crearUsuarioDto.nombre.trim(),
        apellidos: crearUsuarioDto.apellidos.trim(),
        correo: crearUsuarioDto.correo.toLowerCase().trim(),
        contrasena: hashedPassword,
        estado: (crearUsuarioDto as any).estado || 'ACTIVO',
        activo: (crearUsuarioDto as any).estado
          ? (crearUsuarioDto as any).estado === 'ACTIVO'
          : ((crearUsuarioDto as any).activo ?? true),
      });
      return await nuevoUsuario.save();
    } catch (error) {
      if (error.code === 11000) {
        if (error.keyPattern?.correo) {
          throw new ConflictException('El correo ya esta registrado');
        }
        throw new ConflictException('Ya existe un usuario con esos datos');
      }
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async obtenerTodos(): Promise<Usuario[]> {
    return await this.usuarioModel.find().exec();
  }

  async obtenerPorId(id: string): Promise<Usuario> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario invalido');
    }
    const usuario = await this.usuarioModel.findById(id).exec();
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async obtenerPorCorreo(correo: string): Promise<Usuario> {
    const usuario = await this.usuarioModel.findOne({ correo }).exec();
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async obtenerPorNombre(nombre: string): Promise<Usuario | null> {
    return await this.usuarioModel.findOne({ nombre }).exec();
  }

  async obtenerPorRol(rol: RolUsuario): Promise<Usuario[]> {
    return await this.usuarioModel.find({ rol }).exec();
  }

  async actualizar(
    id: string,
    actualizarUsuarioDto: ActualizarUsuarioDto,
  ): Promise<Usuario> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario invalido');
    }
    const usuarioExistente = await this.usuarioModel.findById(id);
    if (!usuarioExistente) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const datos: any = { ...actualizarUsuarioDto };
    if (actualizarUsuarioDto.nombre)
      datos.nombre = actualizarUsuarioDto.nombre.trim();
    if (actualizarUsuarioDto.apellidos)
      datos.apellidos = actualizarUsuarioDto.apellidos.trim();
    if (actualizarUsuarioDto.correo)
      datos.correo = actualizarUsuarioDto.correo.toLowerCase().trim();
    if ((actualizarUsuarioDto as any).estado)
      datos.activo = (actualizarUsuarioDto as any).estado === 'ACTIVO';

    const actualizado = await this.usuarioModel
      .findByIdAndUpdate(id, datos, { new: true, runValidators: true })
      .exec();
    if (!actualizado)
      throw new NotFoundException('Error al actualizar el usuario');
    return actualizado;
  }

  async cambiarPassword(
    id: string,
    cambiarPasswordDto: CambiarPasswordDto,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario invalido');
    }
    const usuario = await this.usuarioModel.findById(id).exec();
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const actual =
      (cambiarPasswordDto as any).contrasenaActual ||
      (cambiarPasswordDto as any)['contraseñaActual'];
    const nueva =
      (cambiarPasswordDto as any).contrasenaNueva ||
      (cambiarPasswordDto as any)['contraseñaNueva'];

    if (!actual)
      throw new BadRequestException('La contrasena actual es requerida');
    if (!nueva || String(nueva).length < 6)
      throw new BadRequestException(
        'La contrasena nueva debe tener al menos 6 caracteres',
      );

    const ok = await bcrypt.compare(
      String(actual),
      (usuario as any).contrasena,
    );
    if (!ok)
      throw new BadRequestException('La contrasena actual es incorrecta');

    const hashed = await bcrypt.hash(String(nueva), 10);
    await this.usuarioModel
      .findByIdAndUpdate(id, { contrasena: hashed })
      .exec();
  }

  async validarCredenciales(
    correo: string,
    contrasena: string,
  ): Promise<Usuario | null> {
    const usuario = await this.usuarioModel.findOne({ correo }).exec();
    if (!usuario) return null;
    const ok = await bcrypt.compare(contrasena, (usuario as any).contrasena);
    return ok ? (usuario as any) : null;
  }

  async asignarTokenReset(correo: string, token: string, exp: Date) {
    const actualizado = await this.usuarioModel
      .findOneAndUpdate(
        { correo: correo.toLowerCase().trim() },
        { resetToken: token, resetTokenExp: exp },
        { new: true },
      )
      .exec();
    return actualizado;
  }

  async obtenerPorTokenReset(token: string): Promise<Usuario | null> {
    return await this.usuarioModel.findOne({ resetToken: token }).exec();
  }

  async actualizarPasswordPorToken(token: string, nueva: string) {
    const usuario = await this.usuarioModel
      .findOne({ resetToken: token })
      .exec();
    if (!usuario) throw new NotFoundException('Token invalido o expirado');
    if (
      !usuario.resetTokenExp ||
      usuario.resetTokenExp.getTime() < Date.now()
    ) {
      throw new BadRequestException('El token de recuperacion ha expirado');
    }
    const hashed = await bcrypt.hash(String(nueva), 10);
    await this.usuarioModel.findByIdAndUpdate(usuario._id, {
      contrasena: hashed,
      resetToken: null,
      resetTokenExp: null,
    });
  }

  async eliminar(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de usuario invalido');
    }
    const usuario = await this.usuarioModel.findById(id).exec();
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const correo = (usuario as any)?.correo?.toLowerCase?.();
    if (correo === 'admin@sena.local') {
      throw new BadRequestException(
        'No se puede eliminar el administrador por defecto',
      );
    }
    await this.usuarioModel.findByIdAndDelete(id).exec();
  }

  async cargaMasivaDesdeBuffer(file: Express.Multer.File): Promise<{
    totalRegistros: number;
    creadosOk: number;
    conErrores: number;
    detalleErrores: { fila: number; motivo: string }[];
  }> {
    const buffer = file?.buffer;
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('No se recibió archivo');
    }

    const mimetype = file.mimetype || 'application/octet-stream';

    let rows: any[] = [];
    try {
      if (mimetype.includes('csv') || mimetype.startsWith('text/')) {
        const content = buffer.toString('utf-8');
        const lines = content.split(/\r?\n/).filter((l) => l.trim().length);
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const required = ['nombre', 'apellidos', 'correo', 'rol'];
        const hasNombreCompleto = headers.includes('nombre completo');
        const hasFicha = headers.includes('ficha');
        const missing = required.filter(
          (r) =>
            !headers.includes(r) && !(r === 'apellidos' && hasNombreCompleto),
        );
        if (missing.length > 0) {
          throw new BadRequestException(
            `Columnas obligatorias faltantes: ${missing.join(', ')}`,
          );
        }
        rows = lines.slice(1).map((line, idx) => {
          const cols = line.split(',').map((c) => c.trim());
          const obj: Record<string, any> = {};
          headers.forEach((h, i) => (obj[h] = cols[i]));
          obj.__row = idx + 2; // número de fila real (incluye header)
          return obj;
        });
      } else if (
        mimetype.includes('sheet') ||
        mimetype.includes('excel') ||
        mimetype === 'application/octet-stream'
      ) {
        // Excel (XLSX/XLS)

        const XLSX = require('xlsx');
        const wb = XLSX.read(buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        rows = (json as any[]).map((r, idx) => ({ ...r, __row: idx + 2 }));
        const headers = Object.keys(json[0] || {}).map((h) => h.toLowerCase());
        const required = ['nombre', 'apellidos', 'correo', 'rol'];
        const hasNombreCompleto = headers.includes('nombre completo');
        const missing = required.filter(
          (r) =>
            !headers.includes(r) && !(r === 'apellidos' && hasNombreCompleto),
        );
        if (missing.length > 0) {
          throw new BadRequestException(
            `Columnas obligatorias faltantes: ${missing.join(', ')}`,
          );
        }
      } else {
        throw new BadRequestException('Tipo de archivo no soportado');
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Error al leer el archivo');
    }

    const errores: { fila: number; motivo: string }[] = [];
    const candidatos: any[] = [];

    const normalizarRol = (rol: string): RolUsuario | null => {
      const v = (rol || '').toLowerCase().trim();
      if (['aprendiz', 'estudiante'].includes(v)) return RolUsuario.ESTUDIANTE;
      if (['evaluador', 'instructor'].includes(v)) return RolUsuario.EVALUADOR;
      if (['admin', 'administrador'].includes(v))
        return RolUsuario.ADMINISTRADOR;
      return null;
    };

    const fichasSolicitadas = new Set<string>();

    rows.forEach((r) => {
      const fila = r.__row || 0;
      const correo = String(r.correo || r.CORREO || '')
        .toLowerCase()
        .trim();
      const nombreCompleto = r['nombre completo'] || r['Nombre completo'];
      const nombre = String(r.nombre || '').trim();
      const apellidos = String(r.apellidos || '').trim();
      const rolStr = String(r.rol || '').trim();
      const rol = normalizarRol(rolStr);
      const documento = (r.documento || r['documento'])?.toString()?.trim();
      const fichaNumero = (r.ficha || r['Ficha'] || '').toString().trim();

      if (!correo) {
        errores.push({ fila, motivo: 'Correo electronico requerido' });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo)) {
        errores.push({
          fila,
          motivo: 'Correo electronico con formato invalido',
        });
        return;
      }
      if (!rol) {
        errores.push({
          fila,
          motivo: 'Rol invalido. Use aprendiz/evaluador/administrador',
        });
        return;
      }

      let n = nombre;
      let a = apellidos;
      if ((!n || n.length < 2) && nombreCompleto) {
        const partes = String(nombreCompleto).trim().split(/\s+/);
        n = partes.slice(0, -1).join(' ') || partes[0] || '';
        a = partes.slice(-1).join(' ') || '';
      }
      if (!n || n.trim().length < 2) {
        errores.push({ fila, motivo: 'Nombre requerido (min 2 caracteres)' });
        return;
      }
      if (!a || a.trim().length < 2) {
        errores.push({
          fila,
          motivo: 'Apellidos requeridos (min 2 caracteres)',
        });
        return;
      }

      if (rol === RolUsuario.ESTUDIANTE) {
        if (!fichaNumero) {
          errores.push({ fila, motivo: 'Ficha requerida para aprendices' });
          return;
        }
        fichasSolicitadas.add(fichaNumero);
      }

      candidatos.push({
        fila,
        correo,
        nombre: n.trim(),
        apellidos: a.trim(),
        rol,
        documento,
        fichaNumero,
      });
    });

    const correos = candidatos.map((c) => c.correo);
    const documentos = candidatos.map((c) => c.documento).filter(Boolean);

    const existentesCorreo = await this.usuarioModel
      .find({ correo: { $in: correos } }, { correo: 1 })
      .lean();
    const existentesDocumento = documentos.length
      ? await this.usuarioModel
          .find({ documento: { $in: documentos } }, { documento: 1 })
          .lean()
      : [];

    const setCorreos = new Set(existentesCorreo.map((x: any) => x.correo));
    const setDocs = new Set(existentesDocumento.map((x: any) => x.documento));

    const fichasMap: Record<string, Types.ObjectId> = {};
    if (fichasSolicitadas.size > 0) {
      const fichas = await this.fichaModel
        .find({ numero: { $in: Array.from(fichasSolicitadas) } }, { numero: 1 })
        .lean();
      const existentesNumeros = new Set(
        (fichas || []).map((f: any) => String(f.numero)),
      );
      candidatos.forEach((c) => {
        if (c.rol === RolUsuario.ESTUDIANTE) {
          if (!existentesNumeros.has(c.fichaNumero)) {
            errores.push({
              fila: c.fila,
              motivo: `La ficha ${c.fichaNumero} no existe. Debe crearla primero.`,
            });
            c.__skip = true;
          }
        }
      });
      // construir mapa numero -> _id
      const fichasId = await this.fichaModel
        .find(
          { numero: { $in: Array.from(fichasSolicitadas) } },
          { numero: 1, _id: 1 },
        )
        .lean();
      fichasId.forEach((f: any) => {
        fichasMap[String(f.numero)] = new Types.ObjectId(f._id);
      });
    }

    const paraInsertar: any[] = [];
    const pendientesAsignacion: Record<string, Types.ObjectId[]> = {};

    for (const c of candidatos) {
      if (c.__skip) continue;
      if (setCorreos.has(c.correo)) {
        errores.push({ fila: c.fila, motivo: 'Correo duplicado' });
        continue;
      }
      if (c.documento && setDocs.has(c.documento)) {
        errores.push({ fila: c.fila, motivo: 'Documento duplicado' });
        continue;
      }

      const plain = `${c.nombre.split(' ')[0]}${Math.floor(Math.random() * 10000)}`;
      const hashedPassword = await bcrypt.hash(String(plain), 10);

      const doc: any = {
        correo: c.correo,
        documento: c.documento,
        nombre: c.nombre,
        apellidos: c.apellidos,
        rol: c.rol,
        contrasena: hashedPassword,
        estado: 'ACTIVO',
        activo: true,
      };
      paraInsertar.push(doc);

      if (c.rol === RolUsuario.ESTUDIANTE && c.fichaNumero) {
        const fichaId = fichasMap[c.fichaNumero];
        if (fichaId) {
          const key = String(fichaId);
          if (!pendientesAsignacion[key]) pendientesAsignacion[key] = [];
          // placeholder; will push inserted _id after insertMany
          (pendientesAsignacion as any)[key].push(null as any);
        }
      }
    }

    let insertados: any[] = [];
    if (paraInsertar.length > 0) {
      try {
        insertados = await this.usuarioModel.insertMany(paraInsertar, {
          ordered: false,
        });
      } catch (e) {
        // insertMany con ordered:false puede registrar errores internos
        if (e?.writeErrors?.length) {
          e.writeErrors.forEach((we: any) => {
            const idx = we.err?.index ?? we.index;
            const fila = candidatos[idx]?.fila || 0;
            errores.push({ fila, motivo: 'Error al crear el usuario' });
          });
        } else {
          throw new BadRequestException('Error al crear usuarios en lote');
        }
      }
    }

    // Reconciliar asignaciones: mapear usuarios insertados a sus fichas
    if (insertados.length > 0) {
      // Construir mapa correo -> _id para enlazar
      const correoToId = new Map(insertados.map((u: any) => [u.correo, u._id]));
      const fichaNumeroToIds: Record<string, Types.ObjectId[]> = {};
      candidatos.forEach((c) => {
        if (
          c.rol === RolUsuario.ESTUDIANTE &&
          c.fichaNumero &&
          correoToId.has(c.correo)
        ) {
          const fid = fichasMap[c.fichaNumero];
          if (fid) {
            const keyNum = c.fichaNumero;
            if (!fichaNumeroToIds[keyNum]) fichaNumeroToIds[keyNum] = [];
            fichaNumeroToIds[keyNum].push(
              new Types.ObjectId(correoToId.get(c.correo)),
            );
          }
        }
      });

      const updates = Object.entries(fichaNumeroToIds).map(([numero, ids]) =>
        this.fichaModel.updateOne(
          { numero },
          { $addToSet: { estudiantesIds: { $each: ids } } },
        ),
      );
      await Promise.all(updates);
    }

    const total = rows.length;
    const ok = insertados.length;
    const fails = total - ok;

    return {
      totalRegistros: total,
      creadosOk: ok,
      conErrores: fails < 0 ? 0 : fails,
      detalleErrores: errores,
    };
  }
}
