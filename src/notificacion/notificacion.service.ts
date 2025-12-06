import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notificacion,
  NotificacionDocument,
  TipoNotificacion,
} from './notificacion.model';
import {
  CrearNotificacionDto,
  FiltroNotificacionDto,
  ActualizarNotificacionDto,
} from './notificacion.dto';

@Injectable()
export class NotificacionService {
  constructor(
    @InjectModel(Notificacion.name)
    private readonly notificacionModel: Model<NotificacionDocument>,
  ) {}

  async crear(
    crearNotificacionDto: CrearNotificacionDto,
  ): Promise<Notificacion> {
    const notificacion = new this.notificacionModel({
      ...crearNotificacionDto,
      usuarioId: new Types.ObjectId(crearNotificacionDto.usuarioId),
    });
    return await notificacion.save();
  }

  async obtenerTodos(filtro?: FiltroNotificacionDto): Promise<Notificacion[]> {
    const query: any = {};

    if (filtro?.usuarioId) {
      query.usuarioId = new Types.ObjectId(filtro.usuarioId);
    }

    if (filtro?.tipo) {
      query.tipo = filtro.tipo;
    }

    if (filtro?.leida !== undefined) {
      query.leida = filtro.leida;
    }

    if (filtro?.fechaDesde || filtro?.fechaHasta) {
      query.fechaCreacion = {};
      if (filtro.fechaDesde) {
        query.fechaCreacion.$gte = new Date(filtro.fechaDesde);
      }
      if (filtro.fechaHasta) {
        query.fechaCreacion.$lte = new Date(filtro.fechaHasta);
      }
    }

    const limit = filtro?.limite || 50;
    const skip = filtro?.pagina ? (filtro.pagina - 1) * limit : 0;

    return await this.notificacionModel
      .find(query)
      .sort({ fechaCreacion: -1 })
      .limit(limit)
      .skip(skip)
      .populate('usuarioId', 'nombre email')
      .exec();
  }

  async obtenerPorId(id: string): Promise<Notificacion> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de notificación inválido');
    }

    const notificacion = await this.notificacionModel
      .findById(id)
      .populate('usuarioId', 'nombre email')
      .exec();

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return notificacion;
  }

  async obtenerPorUsuario(
    usuarioId: string,
    limite = 50,
  ): Promise<Notificacion[]> {
    if (!Types.ObjectId.isValid(usuarioId)) {
      throw new Error('ID de usuario inválido');
    }

    return await this.notificacionModel
      .find({ usuarioId: new Types.ObjectId(usuarioId) })
      .sort({ fechaCreacion: -1 })
      .limit(limite)
      .exec();
  }

  async obtenerNoLeidas(usuarioId: string): Promise<Notificacion[]> {
    if (!Types.ObjectId.isValid(usuarioId)) {
      throw new Error('ID de usuario inválido');
    }

    return await this.notificacionModel
      .find({
        usuarioId: new Types.ObjectId(usuarioId),
        leida: false,
      })
      .sort({ fechaCreacion: -1 })
      .exec();
  }

  async obtenerRecientes(
    usuarioId: string,
    limite = 10,
  ): Promise<Notificacion[]> {
    if (!Types.ObjectId.isValid(usuarioId)) {
      throw new Error('ID de usuario inválido');
    }

    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await this.notificacionModel
      .find({
        usuarioId: new Types.ObjectId(usuarioId),
        fechaCreacion: { $gte: hace24Horas },
      })
      .sort({ fechaCreacion: -1 })
      .limit(limite)
      .exec();
  }

  async obtenerPorTipo(
    tipo: TipoNotificacion,
    limite = 50,
  ): Promise<Notificacion[]> {
    return await this.notificacionModel
      .find({ tipo })
      .sort({ fechaCreacion: -1 })
      .limit(limite)
      .populate('usuarioId', 'nombre email')
      .exec();
  }

  async marcarComoLeida(id: string): Promise<Notificacion> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de notificación inválido');
    }

    const notificacion = await this.notificacionModel.findById(id).exec();
    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    notificacion.leida = true;
    notificacion.fechaLeida = new Date();
    return await notificacion.save();
  }

  async marcarVariasComoLeidas(ids: string[]): Promise<number> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));

    const resultado = await this.notificacionModel
      .updateMany(
        { _id: { $in: validIds.map((id) => new Types.ObjectId(id)) } },
        {
          leida: true,
          fechaLeida: new Date(),
        },
      )
      .exec();

    return resultado.modifiedCount || 0;
  }

  async marcarTodasComoLeidas(usuarioId: string): Promise<number> {
    if (!Types.ObjectId.isValid(usuarioId)) {
      throw new Error('ID de usuario inválido');
    }

    const resultado = await this.notificacionModel
      .updateMany(
        {
          usuarioId: new Types.ObjectId(usuarioId),
          leida: false,
        },
        {
          leida: true,
          fechaLeida: new Date(),
        },
      )
      .exec();

    return resultado.modifiedCount || 0;
  }

  async enviarNotificacion(
    usuarioId: string,
    titulo: string,
    mensaje: string,
    tipo: TipoNotificacion = TipoNotificacion.INFO,
    enlace?: string,
    metadatos?: any,
  ): Promise<Notificacion> {
    const notificacion = new this.notificacionModel({
      usuarioId: new Types.ObjectId(usuarioId),
      titulo,
      mensaje,
      tipo,
      enlace,
      metadatos,
    });

    return await notificacion.save();
  }

  async enviarNotificacionMasiva(
    usuariosIds: string[],
    titulo: string,
    mensaje: string,
    tipo: TipoNotificacion = TipoNotificacion.INFO,
    enlace?: string,
    metadatos?: any,
  ): Promise<Notificacion[]> {
    const validIds = usuariosIds.filter((id) => Types.ObjectId.isValid(id));

    const notificaciones = validIds.map((usuarioId) => ({
      usuarioId: new Types.ObjectId(usuarioId),
      titulo,
      mensaje,
      tipo,
      enlace,
      metadatos,
    }));

    return await this.notificacionModel.insertMany(notificaciones);
  }

  async actualizar(
    id: string,
    actualizarNotificacionDto: ActualizarNotificacionDto,
  ): Promise<Notificacion> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de notificación inválido');
    }

    const notificacion = await this.notificacionModel
      .findByIdAndUpdate(id, actualizarNotificacionDto, { new: true })
      .exec();

    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return notificacion;
  }

  async eliminar(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de notificación inválido');
    }

    const resultado = await this.notificacionModel.findByIdAndDelete(id).exec();
    if (!resultado) {
      throw new NotFoundException('Notificación no encontrada');
    }
  }

  async eliminarVarias(ids: string[]): Promise<number> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));

    const resultado = await this.notificacionModel
      .deleteMany({
        _id: { $in: validIds.map((id) => new Types.ObjectId(id)) },
      })
      .exec();

    return resultado.deletedCount || 0;
  }

  async contarNoLeidas(usuarioId: string): Promise<number> {
    if (!Types.ObjectId.isValid(usuarioId)) {
      throw new Error('ID de usuario inválido');
    }

    return await this.notificacionModel
      .countDocuments({
        usuarioId: new Types.ObjectId(usuarioId),
        leida: false,
      })
      .exec();
  }

  async obtenerEstadisticas(usuarioId?: string): Promise<any> {
    const matchStage: any = {};
    if (usuarioId && Types.ObjectId.isValid(usuarioId)) {
      matchStage.usuarioId = new Types.ObjectId(usuarioId);
    }

    const estadisticas = await this.notificacionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$tipo',
          total: { $sum: 1 },
          leidas: { $sum: { $cond: ['$leida', 1, 0] } },
          noLeidas: { $sum: { $cond: ['$leida', 0, 1] } },
        },
      },
    ]);

    const totalNotificaciones = await this.notificacionModel
      .countDocuments(matchStage)
      .exec();

    const notificacionesHoy = await this.notificacionModel
      .countDocuments({
        ...matchStage,
        fechaCreacion: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      })
      .exec();

    return {
      totalNotificaciones,
      notificacionesHoy,
      estadisticasPorTipo: estadisticas,
    };
  }

  async limpiarAntiguas(diasAntiguedad = 30): Promise<number> {
    const fechaLimite = new Date(
      Date.now() - diasAntiguedad * 24 * 60 * 60 * 1000,
    );

    const resultado = await this.notificacionModel
      .deleteMany({
        fechaCreacion: { $lt: fechaLimite },
        leida: true,
      })
      .exec();

    return resultado.deletedCount || 0;
  }
}
