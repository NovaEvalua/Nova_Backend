import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Proyecto, ProyectoDocument } from './proyecto.model';
import {
  CrearProyectoDto,
  ActualizarProyectoDto,
  FiltroProyectoDto,
} from './proyecto.dto';
import { EstadoProyecto } from '../common/enums/estado-proyecto.enum';
import { RolUsuario } from '../common/enums/rol-usuario.enum';
import { Usuario, UsuarioDocument } from '../usuario/usuario.model';
import { Asignacion, AsignacionDocument } from '../asignacion/asignacion.model';
import {
  Calificacion,
  CalificacionDocument,
} from '../calificacion/calificacion.model';
import { Ficha, FichaDocument } from '../ficha/schemas/ficha.schema';

@Injectable()
export class ProyectoService {
  constructor(
    @InjectModel(Proyecto.name) private proyectoModel: Model<ProyectoDocument>,
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    @InjectModel(Asignacion.name)
    private asignacionModel: Model<AsignacionDocument>,
    @InjectModel(Calificacion.name)
    private calificacionModel: Model<CalificacionDocument>,
    @InjectModel(Ficha.name) private fichaModel: Model<FichaDocument>,
  ) {}

  private buildFichasList(dto: any): Types.ObjectId[] {
    const fichas: Types.ObjectId[] = [];
    if (Array.isArray(dto.fichasIds) && dto.fichasIds.length > 0) {
      dto.fichasIds.forEach((fid: string) => {
        if (!Types.ObjectId.isValid(fid)) {
          throw new BadRequestException('ID de ficha invalido en fichasIds');
        }
        fichas.push(new Types.ObjectId(fid));
      });
    } else if (dto.fichaId && Types.ObjectId.isValid(dto.fichaId)) {
      fichas.push(new Types.ObjectId(dto.fichaId));
    }
    if (fichas.length === 0) {
      throw new BadRequestException(
        'Debe asociar al menos una ficha al proyecto',
      );
    }
    return fichas;
  }

  async crear(
    crearProyectoDto: CrearProyectoDto,
    creadorId: string,
  ): Promise<ProyectoDocument> {
    if (!Types.ObjectId.isValid(creadorId)) {
      throw new BadRequestException('ID de creador invalido');
    }

    if (!crearProyectoDto.nombre || crearProyectoDto.nombre.trim().length < 3) {
      throw new BadRequestException(
        'El nombre debe tener al menos 3 caracteres',
      );
    }
    if (
      !crearProyectoDto.descripcion ||
      crearProyectoDto.descripcion.trim().length < 10
    ) {
      throw new BadRequestException(
        'La descripcion debe tener al menos 10 caracteres',
      );
    }
    if (crearProyectoDto.fechaEntrega) {
      const fechaEntrega = new Date(crearProyectoDto.fechaEntrega);
      const ahora = new Date();
      if (fechaEntrega <= ahora)
        throw new BadRequestException(
          'La fecha de entrega debe ser posterior a la fecha actual',
        );
      const dosAnios = new Date();
      dosAnios.setFullYear(dosAnios.getFullYear() + 2);
      if (fechaEntrega > dosAnios)
        throw new BadRequestException(
          'La fecha de entrega no puede ser mas de 2 anios en el futuro',
        );
    }

    if (crearProyectoDto.evaluadorAsignadoId) {
      if (!Types.ObjectId.isValid(crearProyectoDto.evaluadorAsignadoId)) {
        throw new BadRequestException('ID de evaluador invalido');
      }
      const evaluador = await this.usuarioModel.findById(
        crearProyectoDto.evaluadorAsignadoId,
      );
      if (!evaluador) throw new NotFoundException('Evaluador no encontrado');
      if (
        evaluador.rol !== RolUsuario.EVALUADOR &&
        evaluador.rol !== RolUsuario.ADMINISTRADOR
      ) {
        throw new BadRequestException(
          'El usuario asignado debe tener rol de evaluador o administrador',
        );
      }
      if (!evaluador.activo)
        throw new BadRequestException(
          'El evaluador asignado debe estar activo',
        );
    }

    const fichasIds = this.buildFichasList(crearProyectoDto);

    const proyectoData: any = {
      nombre: crearProyectoDto.nombre.trim(),
      descripcion: crearProyectoDto.descripcion.trim(),
      formato: crearProyectoDto.formato,
      requisitos: crearProyectoDto.requisitos,
      creadorId: new Types.ObjectId(creadorId),
      fichasIds,
      fichaId: fichasIds[0], // compatibilidad
    };

    if (crearProyectoDto.fechaEntrega) {
      proyectoData.fechaEntrega = new Date(crearProyectoDto.fechaEntrega);
    }
    if (crearProyectoDto.evaluadorAsignadoId) {
      proyectoData.evaluadorAsignadoId = new Types.ObjectId(
        crearProyectoDto.evaluadorAsignadoId,
      );
    }
    if (
      Array.isArray((crearProyectoDto as any).evaluadoresAsignadosIds) &&
      (crearProyectoDto as any).evaluadoresAsignadosIds.length > 0
    ) {
      const unique = Array.from(
        new Set((crearProyectoDto as any).evaluadoresAsignadosIds as string[]),
      );
      proyectoData.evaluadoresAsignadosIds = unique.map((eid: string) => {
        if (!Types.ObjectId.isValid(eid))
          throw new BadRequestException('ID de evaluador invalido');
        return new Types.ObjectId(eid);
      });
      if (!proyectoData.evaluadorAsignadoId) {
        proyectoData.evaluadorAsignadoId =
          proyectoData.evaluadoresAsignadosIds[0];
      }
    }
    if (
      crearProyectoDto.instructores &&
      Array.isArray(crearProyectoDto.instructores)
    ) {
      proyectoData.instructoresNombres = crearProyectoDto.instructores;
    }

    try {
      const proyecto = new this.proyectoModel(proyectoData);
      return await proyecto.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Ya existe un proyecto con ese nombre');
      }
      throw new BadRequestException(
        error?.message || 'Error al crear el proyecto',
      );
    }
  }

  private applyFichaFilter(query: any, fichaId?: string) {
    if (fichaId) {
      if (!Types.ObjectId.isValid(fichaId)) {
        throw new BadRequestException('ID de ficha invalido');
      }
      const fid = new Types.ObjectId(fichaId);
      query.$or = [{ fichaId: fid }, { fichasIds: fid }];
    }
  }

  async obtenerTodos(filtros?: FiltroProyectoDto): Promise<ProyectoDocument[]> {
    const query: any = {};

    if (filtros?.creadorId) {
      if (!Types.ObjectId.isValid(filtros.creadorId))
        throw new BadRequestException('ID de creador invalido');
      query.creadorId = new Types.ObjectId(filtros.creadorId);
    }
    if (filtros?.evaluadorAsignadoId) {
      if (!Types.ObjectId.isValid(filtros.evaluadorAsignadoId))
        throw new BadRequestException('ID de evaluador invalido');
      const evId = new Types.ObjectId(filtros.evaluadorAsignadoId);
      query.$or = [
        { evaluadorAsignadoId: evId },
        { evaluadoresAsignadosIds: evId },
      ];
    }
    if (filtros?.estado) query.estado = filtros.estado;
    if (filtros?.busqueda) {
      query.$or = [
        { nombre: { $regex: filtros.busqueda, $options: 'i' } },
        { descripcion: { $regex: filtros.busqueda, $options: 'i' } },
        { requisitos: { $regex: filtros.busqueda, $options: 'i' } },
      ];
    }
    if (filtros?.fechaInicio) {
      query.fechaCreacion = { $gte: new Date(filtros.fechaInicio) };
    }
    if (filtros?.fechaFin) {
      query.fechaCreacion = {
        ...query.fechaCreacion,
        $lte: new Date(filtros.fechaFin),
      };
    }
    this.applyFichaFilter(query, filtros?.fichaId);
    if (filtros?.instructor) {
      query.instructoresNombres = { $regex: filtros.instructor, $options: 'i' };
    }
    if (!filtros?.incluirArchivados) {
      query.estado = { $ne: 'ARCHIVADO' };
    }

    const queryBuilder = this.proyectoModel.find(query);
    if (filtros?.limite) queryBuilder.limit(filtros.limite);
    if (filtros?.offset) queryBuilder.skip(filtros.offset);
    const sortField = filtros?.ordenarPor || 'fechaCreacion';
    const sortDirection = filtros?.direccionOrden === 'asc' ? 1 : -1;
    const sortObject: any = { [sortField]: sortDirection };
    return await queryBuilder.sort(sortObject).exec();
  }

  async obtenerPorId(id: string): Promise<ProyectoDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de proyecto invalido');
    }
    const proyecto = await this.proyectoModel.findById(id).exec();
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    return proyecto;
  }

  async obtenerPorCreador(
    creadorId: string,
    filtros?: FiltroProyectoDto,
  ): Promise<ProyectoDocument[]> {
    if (!Types.ObjectId.isValid(creadorId))
      throw new BadRequestException('ID de creador invalido');
    const query: any = { creadorId: new Types.ObjectId(creadorId) };
    if (filtros?.estado) query.estado = filtros.estado;
    if (filtros?.busqueda) {
      query.$or = [
        { nombre: { $regex: filtros.busqueda, $options: 'i' } },
        { descripcion: { $regex: filtros.busqueda, $options: 'i' } },
        { requisitos: { $regex: filtros.busqueda, $options: 'i' } },
      ];
    }
    if (filtros?.fechaInicio)
      query.fechaCreacion = { $gte: new Date(filtros.fechaInicio) };
    if (filtros?.fechaFin)
      query.fechaCreacion = {
        ...query.fechaCreacion,
        $lte: new Date(filtros.fechaFin),
      };
    this.applyFichaFilter(query, filtros?.fichaId);
    if (filtros?.instructor)
      query.instructoresNombres = { $regex: filtros.instructor, $options: 'i' };
    if (!filtros?.incluirArchivados) query.estado = { $ne: 'ARCHIVADO' };

    const queryBuilder = this.proyectoModel.find(query);
    if (filtros?.limite) queryBuilder.limit(filtros.limite);
    if (filtros?.offset) queryBuilder.skip(filtros.offset);
    const sortField = filtros?.ordenarPor || 'fechaCreacion';
    const sortDirection = filtros?.direccionOrden === 'asc' ? 1 : -1;
    const sortObject: any = { [sortField]: sortDirection };
    return await queryBuilder.sort(sortObject).exec();
  }

  async obtenerPorEvaluador(
    evaluadorId: string,
    filtros?: FiltroProyectoDto,
  ): Promise<ProyectoDocument[]> {
    if (!Types.ObjectId.isValid(evaluadorId))
      throw new BadRequestException('ID de evaluador invalido');
    const query: any = {
      $or: [
        { evaluadorAsignadoId: new Types.ObjectId(evaluadorId) },
        { evaluadoresAsignadosIds: new Types.ObjectId(evaluadorId) },
      ],
    };
    if (filtros?.estado) query.estado = filtros.estado;
    if (filtros?.busqueda) {
      query.$or = [
        { nombre: { $regex: filtros.busqueda, $options: 'i' } },
        { descripcion: { $regex: filtros.busqueda, $options: 'i' } },
        { requisitos: { $regex: filtros.busqueda, $options: 'i' } },
      ];
    }
    if (filtros?.fechaInicio)
      query.fechaCreacion = { $gte: new Date(filtros.fechaInicio) };
    if (filtros?.fechaFin)
      query.fechaCreacion = {
        ...query.fechaCreacion,
        $lte: new Date(filtros.fechaFin),
      };
    this.applyFichaFilter(query, filtros?.fichaId);
    if (filtros?.instructor)
      query.instructoresNombres = { $regex: filtros.instructor, $options: 'i' };
    if (!filtros?.incluirArchivados) query.estado = { $ne: 'ARCHIVADO' };

    const queryBuilder = this.proyectoModel.find(query);
    if (filtros?.limite) queryBuilder.limit(filtros.limite);
    if (filtros?.offset) queryBuilder.skip(filtros.offset);
    const sortField = filtros?.ordenarPor || 'fechaCreacion';
    const sortDirection = filtros?.direccionOrden === 'asc' ? 1 : -1;
    const sortObject: any = { [sortField]: sortDirection };
    return await queryBuilder.sort(sortObject).exec();
  }

  async obtenerDisponibles(): Promise<ProyectoDocument[]> {
    return await this.proyectoModel
      .find({ estado: EstadoProyecto.ACTIVO })
      .sort({ fechaCreacion: -1 })
      .exec();
  }

  async obtenerPorEstado(estado: EstadoProyecto): Promise<ProyectoDocument[]> {
    return await this.proyectoModel
      .find({ estado })
      .sort({ fechaCreacion: -1 })
      .exec();
  }

  async cambiarEstado(
    id: string,
    nuevoEstado: EstadoProyecto,
    usuarioId: string,
    rolUsuario?: RolUsuario,
  ): Promise<ProyectoDocument> {
    const proyecto = await this.obtenerPorId(id);
    const transiciones = this.obtenerTransicionesValidas(proyecto.estado);
    if (!transiciones.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${proyecto.estado} a ${nuevoEstado}`,
      );
    }
    const usuario = await this.usuarioModel.findById(usuarioId).exec();
    const esAdmin =
      rolUsuario === RolUsuario.ADMINISTRADOR ||
      usuario?.rol === RolUsuario.ADMINISTRADOR;
    if (proyecto.creadorId.toString() !== usuarioId && !esAdmin) {
      throw new ForbiddenException(
        'No tienes permisos para cambiar el estado de este proyecto',
      );
    }
    proyecto.estado = nuevoEstado;
    return await proyecto.save();
  }

  async asignarEvaluador(
    id: string,
    evaluadorId: string,
    usuarioId: string,
  ): Promise<ProyectoDocument> {
    const proyecto = await this.obtenerPorId(id);
    if (proyecto.creadorId.toString() !== usuarioId) {
      throw new ForbiddenException(
        'No tienes permisos para asignar evaluador a este proyecto',
      );
    }
    if (!Types.ObjectId.isValid(evaluadorId))
      throw new BadRequestException('ID de evaluador invalido');
    proyecto.evaluadorAsignadoId = new Types.ObjectId(evaluadorId);
    return await proyecto.save();
  }

  async actualizar(
    id: string,
    actualizarProyectoDto: ActualizarProyectoDto,
    usuarioId: string,
    rolUsuario?: RolUsuario,
  ): Promise<ProyectoDocument> {
    const proyecto = await this.obtenerPorId(id);
    const usuario = await this.usuarioModel.findById(usuarioId).exec();
    const esAdmin =
      rolUsuario === RolUsuario.ADMINISTRADOR ||
      usuario?.rol === RolUsuario.ADMINISTRADOR;
    if (proyecto.creadorId.toString() !== usuarioId && !esAdmin) {
      throw new ForbiddenException(
        'No tienes permisos para actualizar este proyecto',
      );
    }
    if (!proyecto.puedeSerEditado()) {
      throw new BadRequestException(
        'El proyecto no puede ser editado en su estado actual',
      );
    }

    if (actualizarProyectoDto.evaluadorAsignadoId) {
      if (!Types.ObjectId.isValid(actualizarProyectoDto.evaluadorAsignadoId)) {
        throw new BadRequestException('ID de evaluador invalido');
      }
      const evaluador = await this.usuarioModel.findById(
        actualizarProyectoDto.evaluadorAsignadoId,
      );
      if (!evaluador) throw new NotFoundException('Evaluador no encontrado');
      if (
        evaluador.rol !== RolUsuario.EVALUADOR &&
        evaluador.rol !== RolUsuario.ADMINISTRADOR
      ) {
        throw new BadRequestException(
          'El usuario asignado debe tener rol de evaluador o administrador',
        );
      }
      if (!evaluador.activo)
        throw new BadRequestException(
          'El evaluador asignado debe estar activo',
        );
    }

    if (
      actualizarProyectoDto.titulo &&
      actualizarProyectoDto.titulo.trim().length < 3
    ) {
      throw new BadRequestException(
        'El titulo debe tener al menos 3 caracteres',
      );
    }
    if (actualizarProyectoDto.titulo) {
      proyecto.nombre = actualizarProyectoDto.titulo.trim();
    }
    if (
      actualizarProyectoDto.descripcion &&
      actualizarProyectoDto.descripcion.trim().length < 10
    ) {
      throw new BadRequestException(
        'La descripcion debe tener al menos 10 caracteres',
      );
    }

    const dtoKeys = Object.keys(actualizarProyectoDto);
    dtoKeys.forEach((key) => {
      const val = (actualizarProyectoDto as any)[key];
      if (val !== undefined) {
        if (key === 'evaluadorAsignadoId' && val) {
          (proyecto as any)[key] = new Types.ObjectId(val);
        } else if (key === 'evaluadoresAsignadosIds' && Array.isArray(val)) {
          const converted = (val as string[]).map((eid: string) => {
            if (!Types.ObjectId.isValid(eid))
              throw new BadRequestException('ID de evaluador invalido');
            return new Types.ObjectId(eid);
          });
          (proyecto as any).evaluadoresAsignadosIds = converted;
        } else if (key === 'fichasIds' && Array.isArray(val)) {
          if (val.length === 0) {
            throw new BadRequestException('Debe asociar al menos una ficha');
          }
          const converted = val.map((fid) => {
            if (!Types.ObjectId.isValid(fid))
              throw new BadRequestException(
                'ID de ficha invalido en fichasIds',
              );
            return new Types.ObjectId(fid);
          });
          proyecto.fichasIds = converted;
          proyecto.fichaId = converted[0];
        } else if (key === 'fichaId' && val) {
          if (!Types.ObjectId.isValid(val))
            throw new BadRequestException('ID de ficha invalido');
          proyecto.fichaId = new Types.ObjectId(val);
          // si se actualiza fichaId sola, sincronizamos fichasIds con la unica ficha
          proyecto.fichasIds = [new Types.ObjectId(val)];
        } else {
          (proyecto as any)[key] = val;
        }
      }
    });

    try {
      return await proyecto.save();
    } catch (error) {
      if (error.code === 11000)
        throw new ConflictException('Ya existe un proyecto con ese nombre');
      throw new BadRequestException('Error al actualizar el proyecto');
    }
  }

  async asignarInstructor(
    id: string,
    instructorId: string,
    usuarioId: string,
    rolUsuario?: RolUsuario,
  ): Promise<ProyectoDocument> {
    const proyecto = await this.obtenerPorId(id);
    const usuario = await this.usuarioModel.findById(usuarioId).exec();
    const esAdmin =
      rolUsuario === RolUsuario.ADMINISTRADOR ||
      usuario?.rol === RolUsuario.ADMINISTRADOR;
    if (proyecto.creadorId.toString() !== usuarioId && !esAdmin) {
      throw new ForbiddenException(
        'No tienes permisos para asignar instructores a este proyecto',
      );
    }
    if (!Types.ObjectId.isValid(instructorId))
      throw new BadRequestException('ID de instructor invalido');
    const instructorObjectId = new Types.ObjectId(instructorId);
    if (
      proyecto.instructoresIds.some((pid) => pid.toString() === instructorId)
    ) {
      throw new BadRequestException(
        'El instructor ya esta asignado a este proyecto',
      );
    }
    const instructor = await this.usuarioModel.findById(instructorId);
    if (!instructor) throw new NotFoundException('Instructor no encontrado');
    if (
      instructor.rol !== RolUsuario.EVALUADOR &&
      instructor.rol !== RolUsuario.ADMINISTRADOR
    ) {
      throw new BadRequestException(
        'El usuario debe tener rol de evaluador o administrador',
      );
    }
    proyecto.instructoresIds.push(instructorObjectId);
    proyecto.instructoresNombres.push(
      `${instructor.nombre} ${instructor.apellidos}`,
    );
    return await proyecto.save();
  }

  async desasignarInstructor(
    id: string,
    instructorId: string,
    usuarioId: string,
    rolUsuario?: RolUsuario,
  ): Promise<ProyectoDocument> {
    const proyecto = await this.obtenerPorId(id);
    const usuario = await this.usuarioModel.findById(usuarioId).exec();
    const esAdmin =
      rolUsuario === RolUsuario.ADMINISTRADOR ||
      usuario?.rol === RolUsuario.ADMINISTRADOR;
    if (proyecto.creadorId.toString() !== usuarioId && !esAdmin) {
      throw new ForbiddenException(
        'No tienes permisos para desasignar instructores de este proyecto',
      );
    }
    if (!Types.ObjectId.isValid(instructorId))
      throw new BadRequestException('ID de instructor invalido');
    const idx = proyecto.instructoresIds.findIndex(
      (pid) => pid.toString() === instructorId,
    );
    if (idx === -1)
      throw new BadRequestException(
        'El instructor no esta asignado a este proyecto',
      );
    proyecto.instructoresIds.splice(idx, 1);
    proyecto.instructoresNombres.splice(idx, 1);
    return await proyecto.save();
  }

  async obtenerInstructores(id: string): Promise<any[]> {
    const proyecto = await this.proyectoModel
      .findById(id)
      .populate('instructores', 'nombre apellido email rol')
      .exec();
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');
    return (proyecto as any).instructores || [];
  }

  async eliminar(
    id: string,
    usuarioId: string,
    rolUsuario?: RolUsuario,
  ): Promise<void> {
    const proyecto = await this.obtenerPorId(id);
    const usuario = await this.usuarioModel.findById(usuarioId).exec();
    const esAdmin =
      rolUsuario === RolUsuario.ADMINISTRADOR ||
      usuario?.rol === RolUsuario.ADMINISTRADOR;
    if (proyecto.creadorId.toString() !== usuarioId && !esAdmin) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este proyecto',
      );
    }
    if (
      proyecto.estado === EstadoProyecto.ACTIVO ||
      proyecto.estado === EstadoProyecto.COMPLETADO
    ) {
      throw new BadRequestException(
        'No se puede eliminar un proyecto activo o completado',
      );
    }
    await this.proyectoModel.findByIdAndDelete(id);
  }

  private obtenerTransicionesValidas(
    estadoActual: EstadoProyecto,
  ): EstadoProyecto[] {
    const transiciones: Record<string, EstadoProyecto[]> = {
      [EstadoProyecto.BORRADOR]: [
        EstadoProyecto.ACTIVO,
        EstadoProyecto.INACTIVO,
      ],
      [EstadoProyecto.ACTIVO]: [
        EstadoProyecto.COMPLETADO,
        EstadoProyecto.INACTIVO,
      ],
      [EstadoProyecto.COMPLETADO]: [EstadoProyecto.INACTIVO],
      [EstadoProyecto.INACTIVO]: [EstadoProyecto.ACTIVO],
    };
    return transiciones[estadoActual] || [];
  }

  private calcularPromedioCalificaciones(
    califs: CalificacionDocument[],
  ): number | null {
    const normalizados = califs
      .filter((c) => c.puntajeMaximo && Number(c.puntajeMaximo) > 0)
      .map((c) => Number(c.puntaje) / Number(c.puntajeMaximo));
    if (!normalizados.length) return null;
    const avg = normalizados.reduce((a, b) => a + b, 0) / normalizados.length;
    return Math.round(avg * 10000) / 10000;
  }

  async obtenerRankingProyecto(
    proyectoId: string,
    opts?: { jornada?: string; desde?: string; hasta?: string },
  ) {
    if (!Types.ObjectId.isValid(proyectoId))
      throw new BadRequestException('ID de proyecto invalido');

    const proyecto = await this.proyectoModel.findById(proyectoId).exec();
    if (!proyecto) throw new NotFoundException('Proyecto no encontrado');

    const asignacionesBase = await this.asignacionModel
      .find({ proyectoId })
      .select('estudianteId evaluacionId')
      .exec();

    if (!asignacionesBase.length) return { top: [], todos: [] };

    let fichasProyecto: (FichaDocument | any)[] = [];
    const fichasIds = (
      (proyecto as any).fichasIds && (proyecto as any).fichasIds.length > 0
        ? (proyecto as any).fichasIds
        : (proyecto as any).fichaId
          ? [(proyecto as any).fichaId]
          : []
    ).map((fid: any) => new Types.ObjectId(fid));
    if (fichasIds.length) {
      fichasProyecto = await this.fichaModel
        .find({ _id: { $in: fichasIds } })
        .select('numero nombre jornada estudiantesIds')
        .exec();
    }

    let allowedStudents: Set<string> | null = null;
    if (
      opts?.jornada &&
      opts.jornada.trim().length > 0 &&
      fichasProyecto.length
    ) {
      const jornadaLower = opts.jornada.toLowerCase();
      const fichasFiltradas = fichasProyecto.filter(
        (f: any) => String(f.jornada || '').toLowerCase() === jornadaLower,
      );
      const ids = new Set<string>();
      fichasFiltradas.forEach((f: any) => {
        const ests: any[] = f.estudiantesIds || [];
        ests.forEach((e: any) => ids.add(e.toString()));
      });
      allowedStudents = ids;
    }

    const asignaciones = asignacionesBase.filter((a) => {
      const estId = a.estudianteId?.toString?.() || '';
      return !allowedStudents || allowedStudents.has(estId);
    });

    const evaluacionIds = Array.from(
      new Set(
        asignaciones
          .map((a) => (a.evaluacionId ? a.evaluacionId.toString() : null))
          .filter(Boolean),
      ),
    );

    const ahora = new Date();
    const desde = opts?.desde
      ? new Date(opts.desde)
      : new Date(ahora.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 d aprox
    const hasta = opts?.hasta ? new Date(opts.hasta) : ahora;

    const califs = evaluacionIds.length
      ? await this.calificacionModel
          .find({
            evaluacionId: { $in: evaluacionIds },
            fechaCreacion: { $gte: desde, $lte: hasta },
          })
          .select(
            'evaluacionId puntaje puntajeMaximo comentarios calificadoPorId fechaCreacion',
          )
          .exec()
      : [];

    const califsPorEvaluacion: Record<string, CalificacionDocument[]> = {};
    califs.forEach((c) => {
      const key = c.evaluacionId?.toString?.() || '';
      if (!key) return;
      if (!califsPorEvaluacion[key]) califsPorEvaluacion[key] = [];
      califsPorEvaluacion[key].push(c);
    });

    const estudiantesIds = Array.from(
      new Set(
        asignaciones
          .map((a) => a.estudianteId?.toString?.() || '')
          .filter(Boolean),
      ),
    );
    const estudiantes = estudiantesIds.length
      ? await this.usuarioModel
          .find({ _id: { $in: estudiantesIds } })
          .select('nombre apellidos correo')
          .exec()
      : [];
    const estMap = new Map<string, UsuarioDocument | any>();
    estudiantes.forEach((e: any) => estMap.set(e._id.toString(), e));

    const fichaPorEst = new Map<string, any>();
    fichasProyecto.forEach((f: any) => {
      const ests: any[] = f.estudiantesIds || [];
      ests.forEach((id: any) => fichaPorEst.set(id.toString(), f));
    });

    const ranking = asignaciones.map((a) => {
      const evalId = a.evaluacionId?.toString?.() || '';
      const califsAsign = evalId ? califsPorEvaluacion[evalId] || [] : [];
      const notaFinal = this.calcularPromedioCalificaciones(califsAsign);
      const observaciones = califsAsign
        .filter((c) => c.comentarios)
        .map((c) => ({
          evaluadorId: c.calificadoPorId?.toString?.() || null,
          comentario: c.comentarios,
        }));
      const estId = a.estudianteId?.toString?.() || '';
      const est = estMap.get(estId);
      const nombreEst = est
        ? `${est.nombre || ''} ${est.apellidos || ''}`.trim() ||
          est.correo ||
          'Aprendiz'
        : 'Aprendiz';
      const f = fichaPorEst.get(estId);
      const fichaDto = f
        ? {
            id: f._id,
            numero: f.numero,
            nombre: f.nombre,
            jornada: f.jornada,
          }
        : null;

      return {
        grupoId: a.estudianteId,
        nombre: nombreEst,
        integrantes: est ? [est] : [a.estudianteId],
        ficha: fichaDto,
        notaFinal,
        observaciones,
        evaluacionesIds: evalId ? [evalId] : [],
      };
    });

    const ordenados = ranking
      .sort((a, b) => {
        if (a.notaFinal == null && b.notaFinal == null) return 0;
        if (a.notaFinal == null) return 1;
        if (b.notaFinal == null) return -1;
        return b.notaFinal - a.notaFinal;
      })
      .map((item, idx) => ({
        ...item,
        posicion: item.notaFinal == null ? null : idx + 1,
      }));

    return {
      top: ordenados.filter((o) => o.notaFinal != null).slice(0, 3),
      todos: ordenados,
    };
  }

  private toMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map((n) => Number(n));
    if (Number.isNaN(h) || Number.isNaN(m))
      throw new BadRequestException('Hora invalida, use HH:mm');
    return h * 60 + m;
  }

  async obtenerEstadisticas(creadorId?: string): Promise<any> {
    const matchStage: any = {};
    if (creadorId) {
      if (!Types.ObjectId.isValid(creadorId))
        throw new BadRequestException('ID de creador invalido');
      matchStage.creadorId = new Types.ObjectId(creadorId);
    }
    const estadisticas = await this.proyectoModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ]);
    const total = await this.proyectoModel.countDocuments(matchStage);
    return {
      total,
      porEstado: estadisticas.reduce(
        (acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async obtenerResumenDashboard(): Promise<any> {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioSemana = new Date();
    inicioSemana.setDate(ahora.getDate() - ahora.getDay());

    const [total, totalMes, totalSemana, porEstado, recientes] =
      await Promise.all([
        this.proyectoModel.countDocuments(),
        this.proyectoModel.countDocuments({ createdAt: { $gte: inicioMes } }),
        this.proyectoModel.countDocuments({
          createdAt: { $gte: inicioSemana },
        }),
        this.proyectoModel.aggregate([
          { $group: { _id: '$estado', count: { $sum: 1 } } },
        ]),
        this.proyectoModel.find().sort({ createdAt: -1 }).limit(5).exec(),
      ]);

    return {
      resumen: {
        total,
        nuevosMes: totalMes,
        nuevosSemana: totalSemana,
        porEstado: porEstado.reduce(
          (acc, item) => {
            acc[item._id] = item.count;
            return acc;
          },
          {} as Record<string, number>,
        ),
      },
      proyectosRecientes: recientes,
    };
  }

  async obtenerTendencias(periodo: string, creadorId?: string): Promise<any> {
    const ahora = new Date();
    let fechaInicio = new Date();
    let formatoFecha = '%Y-%m-%d';
    let agrupacion: any = {
      $dateToString: { format: formatoFecha, date: '$createdAt' },
    };

    switch (periodo) {
      case 'semana':
        fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        formatoFecha = '%Y-%m-%d';
        agrupacion = {
          $dateToString: { format: formatoFecha, date: '$createdAt' },
        };
        break;
      case 'trimestre':
        fechaInicio = new Date(ahora.setMonth(ahora.getMonth() - 3));
        formatoFecha = '%Y-%m';
        agrupacion = {
          $dateToString: { format: formatoFecha, date: '$createdAt' },
        };
        break;
      case 'anio':
        fechaInicio = new Date(ahora.setFullYear(ahora.getFullYear() - 1));
        formatoFecha = '%Y-%m';
        agrupacion = {
          $dateToString: { format: formatoFecha, date: '$createdAt' },
        };
        break;
      default:
        fechaInicio = new Date(ahora.setMonth(ahora.getMonth() - 1));
        formatoFecha = '%Y-%m-%d';
        agrupacion = {
          $dateToString: { format: formatoFecha, date: '$createdAt' },
        };
        break;
    }

    const matchStage: any = { createdAt: { $gte: fechaInicio } };
    if (creadorId) {
      if (!Types.ObjectId.isValid(creadorId))
        throw new BadRequestException('ID de creador invalido');
      matchStage.creadorId = new Types.ObjectId(creadorId);
    }

    const tendencias = await this.proyectoModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: agrupacion,
          total: { $sum: 1 },
          activos: {
            $sum: {
              $cond: [{ $eq: ['$estado', EstadoProyecto.ACTIVO] }, 1, 0],
            },
          },
          completados: {
            $sum: {
              $cond: [{ $eq: ['$estado', EstadoProyecto.COMPLETADO] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return { periodo, fechaInicio, datos: tendencias };
  }

  async obtenerMetricasEvaluador(evaluadorId: string): Promise<any> {
    if (!Types.ObjectId.isValid(evaluadorId))
      throw new BadRequestException('ID de evaluador invalido');
    const evObj = new Types.ObjectId(evaluadorId);
    const membership = {
      $or: [{ evaluadorAsignadoId: evObj }, { evaluadoresAsignadosIds: evObj }],
    };
    const asignados = await this.proyectoModel.countDocuments(membership);
    const evaluados = await this.proyectoModel.countDocuments({
      ...membership,
      estado: { $in: [EstadoProyecto.COMPLETADO, EstadoProyecto.INACTIVO] },
    });
    const pendientes = await this.proyectoModel.countDocuments({
      ...membership,
      estado: EstadoProyecto.ACTIVO,
    });
    const eficiencia =
      asignados > 0 ? Math.round((evaluados / asignados) * 10000) / 100 : 0;
    return {
      proyectosAsignados: asignados,
      proyectosEvaluados: evaluados,
      proyectosPendientes: pendientes,
      eficiencia,
    };
  }
}
