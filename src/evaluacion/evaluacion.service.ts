import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Evaluacion,
  EvaluacionDocument,
  EstadoEvaluacion,
  TipoEvaluacion,
} from './evaluacion.model';
import {
  CrearEvaluacionDto,
  ActualizarEvaluacionDto,
  FiltroEvaluacionDto,
} from './evaluacion.dto';

@Injectable()
export class EvaluacionService {
  constructor(
    @InjectModel(Evaluacion.name)
    private readonly evaluacionModel: Model<EvaluacionDocument>,
  ) {}

  async crear(
    crearEvaluacionDto: CrearEvaluacionDto,
    usuarioId: string,
  ): Promise<EvaluacionDocument> {
    try {
      // Validar usuario evaluador
      if (!Types.ObjectId.isValid(usuarioId)) {
        throw new BadRequestException('ID de usuario inválido');
      }

      // Validar campos obligatorios
      if (
        !crearEvaluacionDto.titulo ||
        crearEvaluacionDto.titulo.trim().length < 3
      ) {
        throw new BadRequestException(
          'El título debe tener al menos 3 caracteres',
        );
      }

      if (
        !crearEvaluacionDto.descripcion ||
        crearEvaluacionDto.descripcion.trim().length < 10
      ) {
        throw new BadRequestException(
          'La descripción debe tener al menos 10 caracteres',
        );
      }

      // Validar fechas
      const fechaInicio = new Date(crearEvaluacionDto.fechaInicio);
      const fechaFin = new Date(crearEvaluacionDto.fechaFin);
      const ahora = new Date();
      const dosAnosEnFuturo = new Date();
      dosAnosEnFuturo.setFullYear(ahora.getFullYear() + 2);

      if (fechaInicio >= fechaFin) {
        throw new BadRequestException(
          'La fecha de inicio debe ser anterior a la fecha de fin',
        );
      }

      if (fechaInicio < ahora) {
        throw new BadRequestException(
          'La fecha de inicio no puede ser en el pasado',
        );
      }

      if (fechaFin > dosAnosEnFuturo) {
        throw new BadRequestException(
          'La fecha de fin no puede ser más de 2 años en el futuro',
        );
      }

      // Validar duración
      if (crearEvaluacionDto.duracionMinutos !== undefined) {
        if (crearEvaluacionDto.duracionMinutos < 5) {
          throw new BadRequestException(
            'La duración mínima de una evaluación es de 5 minutos',
          );
        }
        if (crearEvaluacionDto.duracionMinutos > 480) {
          // 8 horas
          throw new BadRequestException(
            'La duración máxima de una evaluación es de 8 horas',
          );
        }
      }

      // Validar puntaje máximo
      if (crearEvaluacionDto.puntajeMaximo !== undefined) {
        if (crearEvaluacionDto.puntajeMaximo <= 0) {
          throw new BadRequestException('El puntaje máximo debe ser mayor a 0');
        }
        if (crearEvaluacionDto.puntajeMaximo > 1000) {
          throw new BadRequestException(
            'El puntaje máximo no puede exceder 1000 puntos',
          );
        }
      }

      // Validar numeroMaximoReintentos en configuración si se proporciona
      if (
        crearEvaluacionDto.configuracion?.numeroMaximoReintentos !== undefined
      ) {
        if (crearEvaluacionDto.configuracion.numeroMaximoReintentos < 1) {
          throw new BadRequestException('Debe permitir al menos 1 intento');
        }
        if (crearEvaluacionDto.configuracion.numeroMaximoReintentos > 10) {
          throw new BadRequestException(
            'No se pueden permitir más de 10 intentos',
          );
        }
      }

      // Verificar que no exista una evaluación con el mismo título
      const evaluacionExistente = await this.evaluacionModel.findOne({
        titulo: crearEvaluacionDto.titulo.trim(),
        evaluadorId: new Types.ObjectId(usuarioId),
      });

      if (evaluacionExistente) {
        throw new ConflictException('Ya tienes una evaluación con ese título');
      }

      const evaluacion = new this.evaluacionModel({
        ...crearEvaluacionDto,
        titulo: crearEvaluacionDto.titulo.trim(),
        descripcion: crearEvaluacionDto.descripcion.trim(),
        evaluadorId: new Types.ObjectId(usuarioId),
        creadoPor: new Types.ObjectId(usuarioId),
        modificadoPor: new Types.ObjectId(usuarioId),
      });

      return await evaluacion.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Ya existe una evaluación con ese título');
      }
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Error al crear la evaluación');
    }
  }

  async obtenerTodas(
    filtros: FiltroEvaluacionDto = {},
  ): Promise<EvaluacionDocument[]> {
    const query: any = {};

    if (filtros.evaluadorId) {
      if (!Types.ObjectId.isValid(filtros.evaluadorId)) {
        throw new BadRequestException('ID de evaluador inválido');
      }
      query.evaluadorId = new Types.ObjectId(filtros.evaluadorId);
    }

    if (filtros.estado) {
      query.estado = filtros.estado;
    }

    if (filtros.tipo) {
      query.tipo = filtros.tipo;
    }

    if (filtros.activa !== undefined) {
      query.activa = filtros.activa;
    }

    if (filtros.fechaInicio && filtros.fechaFin) {
      query.fechaInicio = {
        $gte: new Date(filtros.fechaInicio),
        $lte: new Date(filtros.fechaFin),
      };
    }

    if (filtros.busqueda) {
      query.$or = [
        { titulo: { $regex: filtros.busqueda, $options: 'i' } },
        { descripcion: { $regex: filtros.busqueda, $options: 'i' } },
        { tipo: { $regex: filtros.busqueda, $options: 'i' } },
      ];
    }

    if (filtros.estudianteId) {
      if (!Types.ObjectId.isValid(filtros.estudianteId)) {
        throw new BadRequestException('ID de estudiante inválido');
      }
      query.estudiantesAsignados = new Types.ObjectId(filtros.estudianteId);
    }

    if (!filtros.incluirInactivas) {
      query.activa = true;
    }

    // Configurar ordenamiento
    const sortField = filtros.ordenarPor || 'fechaCreacion';
    const sortDirection = filtros.direccionOrden === 'asc' ? 1 : -1;
    const sortObject: any = { [sortField]: sortDirection };

    return await this.evaluacionModel
      .find(query)
      .populate('evaluadorId', 'nombre email')
      .populate('estudiantesAsignados', 'nombre email')
      .sort(sortObject)
      .limit(filtros.limite || 50)
      .skip(filtros.offset || 0)
      .exec();
  }

  async obtenerPorId(id: string): Promise<EvaluacionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de evaluación inválido');
    }

    const evaluacion = await this.evaluacionModel
      .findById(id)
      .populate('evaluadorId', 'nombre email')
      .populate('estudiantesAsignados', 'nombre email')
      .exec();

    if (!evaluacion) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    return evaluacion;
  }

  async obtenerPorEvaluador(
    evaluadorId: string,
    filtros: FiltroEvaluacionDto = {},
  ): Promise<EvaluacionDocument[]> {
    if (!Types.ObjectId.isValid(evaluadorId)) {
      throw new BadRequestException('ID de evaluador inválido');
    }

    const query: any = { evaluadorId: new Types.ObjectId(evaluadorId) };

    if (filtros.estado) {
      query.estado = filtros.estado;
    }

    if (filtros.tipo) {
      query.tipo = filtros.tipo;
    }

    if (filtros.activa !== undefined) {
      query.activa = filtros.activa;
    }

    if (filtros.busqueda) {
      query.$or = [
        { titulo: { $regex: filtros.busqueda, $options: 'i' } },
        { descripcion: { $regex: filtros.busqueda, $options: 'i' } },
        { tipo: { $regex: filtros.busqueda, $options: 'i' } },
      ];
    }

    if (filtros.estudianteId) {
      if (!Types.ObjectId.isValid(filtros.estudianteId)) {
        throw new BadRequestException('ID de estudiante inválido');
      }
      query.estudiantesAsignados = new Types.ObjectId(filtros.estudianteId);
    }

    if (!filtros.incluirInactivas) {
      query.activa = true;
    }

    // Configurar ordenamiento
    const sortField = filtros?.ordenarPor || 'fechaCreacion';
    const sortDirection = filtros?.direccionOrden === 'asc' ? 1 : -1;
    const sortObject: any = { [sortField]: sortDirection };

    return await this.evaluacionModel
      .find(query)
      .populate('estudiantesAsignados', 'nombre email')
      .sort(sortObject)
      .limit(filtros.limite || 20)
      .skip(filtros.offset || 0)
      .exec();
  }

  async obtenerPorEstudiante(
    estudianteId: string,
    filtros: FiltroEvaluacionDto = {},
  ): Promise<EvaluacionDocument[]> {
    if (!Types.ObjectId.isValid(estudianteId)) {
      throw new BadRequestException('ID de estudiante inválido');
    }

    const query: any = {
      estudiantesAsignados: new Types.ObjectId(estudianteId),
      activa: true,
    };

    if (filtros.estado) {
      query.estado = filtros.estado;
    }

    if (filtros.tipo) {
      query.tipo = filtros.tipo;
    }

    return await this.evaluacionModel
      .find(query)
      .populate('evaluadorId', 'nombre email')
      .sort({ fechaInicio: 1 })
      .limit(filtros.limite || 20)
      .skip(filtros.offset || 0)
      .exec();
  }

  async actualizar(
    id: string,
    actualizarEvaluacionDto: ActualizarEvaluacionDto,
    usuarioId: string,
  ): Promise<EvaluacionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de evaluación inválido');
    }

    const evaluacion = await this.evaluacionModel.findById(id);
    if (!evaluacion) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    // Verificar que el usuario sea el evaluador o administrador
    if (evaluacion.evaluadorId.toString() !== usuarioId) {
      throw new BadRequestException(
        'No tienes permisos para actualizar esta evaluación',
      );
    }

    // No permitir actualizar evaluaciones finalizadas
    if (evaluacion.estado === EstadoEvaluacion.FINALIZADA) {
      throw new ConflictException(
        'No se puede actualizar una evaluación finalizada',
      );
    }

    // Validaciones específicas antes de actualizar
    if (
      actualizarEvaluacionDto.titulo &&
      actualizarEvaluacionDto.titulo.trim().length < 3
    ) {
      throw new BadRequestException(
        'El título debe tener al menos 3 caracteres',
      );
    }

    if (
      actualizarEvaluacionDto.descripcion &&
      actualizarEvaluacionDto.descripcion.trim().length < 10
    ) {
      throw new BadRequestException(
        'La descripción debe tener al menos 10 caracteres',
      );
    }

    // Validar fechas
    const fechaInicio = actualizarEvaluacionDto.fechaInicio
      ? new Date(actualizarEvaluacionDto.fechaInicio)
      : evaluacion.fechaInicio;
    const fechaFin = actualizarEvaluacionDto.fechaFin
      ? new Date(actualizarEvaluacionDto.fechaFin)
      : evaluacion.fechaFin;
    const ahora = new Date();

    if (fechaInicio >= fechaFin) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    // Solo validar fecha de inicio en el pasado si la evaluación está en borrador
    if (
      evaluacion.estado === EstadoEvaluacion.BORRADOR &&
      actualizarEvaluacionDto.fechaInicio
    ) {
      if (fechaInicio < ahora) {
        throw new BadRequestException(
          'La fecha de inicio no puede ser en el pasado',
        );
      }
    }

    // Validar duración
    if (actualizarEvaluacionDto.duracionMinutos !== undefined) {
      if (actualizarEvaluacionDto.duracionMinutos < 5) {
        throw new BadRequestException(
          'La duración mínima de una evaluación es de 5 minutos',
        );
      }
      if (actualizarEvaluacionDto.duracionMinutos > 480) {
        // 8 horas
        throw new BadRequestException(
          'La duración máxima de una evaluación es de 8 horas',
        );
      }
    }

    // Validar puntaje máximo
    if (actualizarEvaluacionDto.puntajeMaximo !== undefined) {
      if (actualizarEvaluacionDto.puntajeMaximo <= 0) {
        throw new BadRequestException('El puntaje máximo debe ser mayor a 0');
      }
      if (actualizarEvaluacionDto.puntajeMaximo > 1000) {
        throw new BadRequestException(
          'El puntaje máximo no puede exceder 1000 puntos',
        );
      }
    }

    // Validar numeroMaximoReintentos en configuración si se proporciona
    if (
      actualizarEvaluacionDto.configuracion?.numeroMaximoReintentos !==
      undefined
    ) {
      if (actualizarEvaluacionDto.configuracion.numeroMaximoReintentos < 1) {
        throw new BadRequestException('Debe permitir al menos 1 intento');
      }
      if (actualizarEvaluacionDto.configuracion.numeroMaximoReintentos > 10) {
        throw new BadRequestException(
          'No se pueden permitir más de 10 intentos',
        );
      }
    }

    // No permitir cambiar evaluaciones que ya han iniciado (excepto ciertos campos)
    if (evaluacion.estado === EstadoEvaluacion.EN_PROGRESO) {
      const camposPermitidos = ['descripcion', 'instrucciones'];
      const camposProhibidos = Object.keys(actualizarEvaluacionDto).filter(
        (campo) => !camposPermitidos.includes(campo),
      );

      if (camposProhibidos.length > 0) {
        throw new BadRequestException(
          `No se pueden modificar los siguientes campos en una evaluación en progreso: ${camposProhibidos.join(', ')}`,
        );
      }
    }

    try {
      const evaluacionActualizada = await this.evaluacionModel
        .findByIdAndUpdate(
          id,
          {
            ...actualizarEvaluacionDto,
            modificadoPor: new Types.ObjectId(usuarioId),
          },
          { new: true, runValidators: true },
        )
        .populate('evaluadorId', 'nombre email')
        .populate('estudiantesAsignados', 'nombre email')
        .exec();

      if (!evaluacionActualizada) {
        throw new NotFoundException('Error al actualizar la evaluación');
      }
      return evaluacionActualizada;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Ya existe una evaluación con ese título');
      }
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar la evaluación');
    }
  }

  async cambiarEstado(
    id: string,
    nuevoEstado: EstadoEvaluacion,
    usuarioId: string,
  ): Promise<EvaluacionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de evaluación inválido');
    }

    const evaluacion = await this.evaluacionModel.findById(id);
    if (!evaluacion) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    // Verificar que el usuario sea el evaluador
    if (evaluacion.evaluadorId.toString() !== usuarioId) {
      throw new BadRequestException(
        'No tienes permisos para cambiar el estado de esta evaluación',
      );
    }

    // Validar transiciones de estado
    const transicionesValidas: Record<EstadoEvaluacion, EstadoEvaluacion[]> = {
      [EstadoEvaluacion.BORRADOR]: [
        EstadoEvaluacion.PUBLICADA,
        EstadoEvaluacion.CANCELADA,
      ],
      [EstadoEvaluacion.PUBLICADA]: [
        EstadoEvaluacion.EN_PROGRESO,
        EstadoEvaluacion.CANCELADA,
      ],
      [EstadoEvaluacion.EN_PROGRESO]: [
        EstadoEvaluacion.FINALIZADA,
        EstadoEvaluacion.CANCELADA,
      ],
      [EstadoEvaluacion.FINALIZADA]: [],
      [EstadoEvaluacion.CANCELADA]: [EstadoEvaluacion.BORRADOR],
    };

    if (!transicionesValidas[evaluacion.estado].includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${evaluacion.estado} a ${nuevoEstado}`,
      );
    }

    const evaluacionActualizada = await this.evaluacionModel
      .findByIdAndUpdate(
        id,
        {
          estado: nuevoEstado,
          modificadoPor: new Types.ObjectId(usuarioId),
        },
        { new: true, runValidators: true },
      )
      .populate('evaluadorId', 'nombre email')
      .populate('estudiantesAsignados', 'nombre email')
      .exec();

    if (!evaluacionActualizada) {
      throw new NotFoundException(
        'Error al cambiar el estado de la evaluación',
      );
    }
    return evaluacionActualizada;
  }

  async asignarEstudiantes(
    id: string,
    estudiantesIds: string[],
    usuarioId: string,
  ): Promise<EvaluacionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de evaluación inválido');
    }

    // Validar IDs de estudiantes
    const estudiantesObjectIds = estudiantesIds.map((estudianteId) => {
      if (!Types.ObjectId.isValid(estudianteId)) {
        throw new BadRequestException(
          `ID de estudiante inválido: ${estudianteId}`,
        );
      }
      return new Types.ObjectId(estudianteId);
    });

    const evaluacion = await this.evaluacionModel.findById(id);
    if (!evaluacion) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    // Verificar que el usuario sea el evaluador
    if (evaluacion.evaluadorId.toString() !== usuarioId) {
      throw new BadRequestException(
        'No tienes permisos para asignar estudiantes a esta evaluación',
      );
    }

    const evaluacionActualizada = await this.evaluacionModel
      .findByIdAndUpdate(
        id,
        {
          estudiantesAsignados: estudiantesObjectIds,
          modificadoPor: new Types.ObjectId(usuarioId),
        },
        { new: true, runValidators: true },
      )
      .populate('evaluadorId', 'nombre email')
      .populate('estudiantesAsignados', 'nombre email')
      .exec();

    if (!evaluacionActualizada) {
      throw new NotFoundException(
        'Error al asignar estudiantes a la evaluación',
      );
    }
    return evaluacionActualizada;
  }

  async eliminar(id: string, usuarioId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de evaluación inválido');
    }

    const evaluacion = await this.evaluacionModel.findById(id);
    if (!evaluacion) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    // Verificar que el usuario sea el evaluador
    if (evaluacion.evaluadorId.toString() !== usuarioId) {
      throw new BadRequestException(
        'No tienes permisos para eliminar esta evaluación',
      );
    }

    // No permitir eliminar evaluaciones en progreso o finalizadas
    if (
      [EstadoEvaluacion.EN_PROGRESO, EstadoEvaluacion.FINALIZADA].includes(
        evaluacion.estado,
      )
    ) {
      throw new ConflictException(
        'No se puede eliminar una evaluación en progreso o finalizada',
      );
    }

    await this.evaluacionModel.findByIdAndDelete(id);
  }

  async obtenerEstadisticas(evaluadorId?: string): Promise<any> {
    const matchStage: any = {};

    if (evaluadorId) {
      if (!Types.ObjectId.isValid(evaluadorId)) {
        throw new BadRequestException('ID de evaluador inválido');
      }
      matchStage.evaluadorId = new Types.ObjectId(evaluadorId);
    }

    const estadisticas = await this.evaluacionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalEvaluaciones: { $sum: 1 },
          evaluacionesPorEstado: {
            $push: {
              estado: '$estado',
              count: 1,
            },
          },
          evaluacionesPorTipo: {
            $push: {
              tipo: '$tipo',
              count: 1,
            },
          },
          promedioEstudiantes: { $avg: { $size: '$estudiantesAsignados' } },
          promedioDuracion: { $avg: '$duracionMinutos' },
          promedioPuntajeMaximo: { $avg: '$puntajeMaximo' },
        },
      },
    ]);

    // Procesar estadísticas por estado
    const estadisticasPorEstado = await this.evaluacionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$estado',
          count: { $sum: 1 },
        },
      },
    ]);

    // Procesar estadísticas por tipo
    const estadisticasPorTipo = await this.evaluacionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$tipo',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      resumen: estadisticas[0] || {
        totalEvaluaciones: 0,
        promedioEstudiantes: 0,
        promedioDuracion: 0,
        promedioPuntajeMaximo: 0,
      },
      porEstado: estadisticasPorEstado.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      porTipo: estadisticasPorTipo.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
    };
  }

  async obtenerResumenDashboard(): Promise<any> {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioSemana = new Date(
      ahora.setDate(ahora.getDate() - ahora.getDay()),
    );

    const [
      total,
      totalMes,
      totalSemana,
      activas,
      vencidas,
      porEstado,
      porTipo,
      promedios,
    ] = await Promise.all([
      this.evaluacionModel.countDocuments(),
      this.evaluacionModel.countDocuments({ createdAt: { $gte: inicioMes } }),
      this.evaluacionModel.countDocuments({
        createdAt: { $gte: inicioSemana },
      }),
      this.evaluacionModel.countDocuments({
        activa: true,
        estado: EstadoEvaluacion.PUBLICADA,
        fechaInicio: { $lte: ahora },
        fechaFin: { $gte: ahora },
      }),
      this.evaluacionModel.countDocuments({
        activa: true,
        fechaFin: { $lt: ahora },
        estado: { $ne: EstadoEvaluacion.FINALIZADA },
      }),
      this.evaluacionModel.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } },
      ]),
      this.evaluacionModel.aggregate([
        { $group: { _id: '$tipo', count: { $sum: 1 } } },
      ]),
      this.evaluacionModel.aggregate([
        {
          $group: {
            _id: null,
            promedioDuracion: { $avg: '$duracionMinutos' },
            promedioPuntaje: { $avg: '$puntajeMaximo' },
            promedioEstudiantes: { $avg: { $size: '$estudiantesAsignados' } },
          },
        },
      ]),
    ]);

    return {
      resumen: {
        total,
        nuevosMes: totalMes,
        nuevosSemana: totalSemana,
        activas,
        vencidas,
        porEstado: porEstado.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        porTipo: porTipo.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      },
      promedios: promedios[0] || {
        promedioDuracion: 0,
        promedioPuntaje: 0,
        promedioEstudiantes: 0,
      },
    };
  }

  async obtenerMetricasEvaluador(evaluadorId: string): Promise<any> {
    if (!Types.ObjectId.isValid(evaluadorId)) {
      throw new BadRequestException('ID de evaluador inválido');
    }

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const [
      totalCreadas,
      activasCreadas,
      finalizadas,
      promedioParticipacion,
      evaluacionesRecientes,
    ] = await Promise.all([
      this.evaluacionModel.countDocuments({
        evaluadorId: new Types.ObjectId(evaluadorId),
      }),
      this.evaluacionModel.countDocuments({
        evaluadorId: new Types.ObjectId(evaluadorId),
        activa: true,
        estado: EstadoEvaluacion.PUBLICADA,
      }),
      this.evaluacionModel.countDocuments({
        evaluadorId: new Types.ObjectId(evaluadorId),
        estado: EstadoEvaluacion.FINALIZADA,
      }),
      this.evaluacionModel.aggregate([
        { $match: { evaluadorId: new Types.ObjectId(evaluadorId) } },
        {
          $group: {
            _id: null,
            promedioEstudiantes: { $avg: { $size: '$estudiantesAsignados' } },
            promedioDuracion: { $avg: '$duracionMinutos' },
          },
        },
      ]),
      this.evaluacionModel
        .find({ evaluadorId: new Types.ObjectId(evaluadorId) })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('titulo estado createdAt estudiantesAsignados')
        .exec(),
    ]);

    const tasaFinalizacion =
      totalCreadas > 0 ? (finalizadas / totalCreadas) * 100 : 0;

    return {
      totalCreadas,
      activasCreadas,
      finalizadas,
      tasaFinalizacion: Math.round(tasaFinalizacion * 100) / 100,
      promedioParticipacion: promedioParticipacion[0] || {
        promedioEstudiantes: 0,
        promedioDuracion: 0,
      },
      evaluacionesRecientes,
    };
  }

  async obtenerRendimiento(
    periodo: string,
    evaluadorId?: string,
  ): Promise<any> {
    const ahora = new Date();
    let fechaInicio: Date;

    switch (periodo) {
      case 'semana':
        fechaInicio = new Date(ahora.setDate(ahora.getDate() - 7));
        break;
      case 'trimestre':
        fechaInicio = new Date(ahora.setMonth(ahora.getMonth() - 3));
        break;
      default: // mes
        fechaInicio = new Date(ahora.setMonth(ahora.getMonth() - 1));
    }

    const matchStage: any = { createdAt: { $gte: fechaInicio } };
    if (evaluadorId) {
      matchStage.evaluadorId = new Types.ObjectId(evaluadorId);
    }

    const [rendimientoPorDia, estadisticasGenerales, topEvaluadores] =
      await Promise.all([
        this.evaluacionModel.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              totalCreadas: { $sum: 1 },
              publicadas: {
                $sum: {
                  $cond: [
                    { $eq: ['$estado', EstadoEvaluacion.PUBLICADA] },
                    1,
                    0,
                  ],
                },
              },
              finalizadas: {
                $sum: {
                  $cond: [
                    { $eq: ['$estado', EstadoEvaluacion.FINALIZADA] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        this.evaluacionModel.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              totalEvaluaciones: { $sum: 1 },
              promedioEstudiantes: { $avg: { $size: '$estudiantesAsignados' } },
              promedioDuracion: { $avg: '$duracionMinutos' },
            },
          },
        ]),
        evaluadorId
          ? []
          : this.evaluacionModel.aggregate([
              { $match: matchStage },
              {
                $group: {
                  _id: '$evaluadorId',
                  totalEvaluaciones: { $sum: 1 },
                  evaluacionesPublicadas: {
                    $sum: {
                      $cond: [
                        { $eq: ['$estado', EstadoEvaluacion.PUBLICADA] },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
              { $sort: { totalEvaluaciones: -1 } },
              { $limit: 5 },
              {
                $lookup: {
                  from: 'usuarios',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'evaluador',
                },
              },
              { $unwind: '$evaluador' },
            ]),
      ]);

    return {
      periodo,
      fechaInicio,
      rendimientoPorDia,
      estadisticasGenerales: estadisticasGenerales[0] || {
        totalEvaluaciones: 0,
        promedioEstudiantes: 0,
        promedioDuracion: 0,
      },
      topEvaluadores,
    };
  }

  async obtenerEvaluacionesActivas(): Promise<EvaluacionDocument[]> {
    const ahora = new Date();

    return await this.evaluacionModel
      .find({
        activa: true,
        estado: EstadoEvaluacion.PUBLICADA,
        fechaInicio: { $lte: ahora },
        fechaFin: { $gte: ahora },
      })
      .populate('evaluadorId', 'nombre email')
      .populate('estudiantesAsignados', 'nombre email')
      .sort({ fechaInicio: 1 })
      .exec();
  }

  async obtenerEvaluacionesVencidas(): Promise<EvaluacionDocument[]> {
    const ahora = new Date();

    return await this.evaluacionModel
      .find({
        activa: true,
        fechaFin: { $lt: ahora },
        estado: { $ne: EstadoEvaluacion.FINALIZADA },
      })
      .populate('evaluadorId', 'nombre email')
      .populate('estudiantesAsignados', 'nombre email')
      .sort({ fechaFin: -1 })
      .exec();
  }
}
