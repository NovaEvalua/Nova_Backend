import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Historial, HistorialDocument } from './historial.model';
import { CrearHistorialDto, FiltroHistorialDto } from './historial.dto';

@Injectable()
export class HistorialService {
  constructor(
    @InjectModel(Historial.name)
    private readonly historialModel: Model<HistorialDocument>,
  ) {}

  async crear(crearHistorialDto: CrearHistorialDto): Promise<Historial> {
    const historial = new this.historialModel({
      ...crearHistorialDto,
      usuarioId: new Types.ObjectId(crearHistorialDto.usuarioId),
      proyectoId: crearHistorialDto.proyectoId
        ? new Types.ObjectId(crearHistorialDto.proyectoId)
        : null,
      evaluacionId: crearHistorialDto.evaluacionId
        ? new Types.ObjectId(crearHistorialDto.evaluacionId)
        : null,
    });
    return await historial.save();
  }

  async obtenerTodos(filtro?: FiltroHistorialDto): Promise<Historial[]> {
    const query: any = {};

    if (filtro?.usuarioId) {
      query.usuarioId = new Types.ObjectId(filtro.usuarioId);
    }

    if (filtro?.proyectoId) {
      query.proyectoId = new Types.ObjectId(filtro.proyectoId);
    }

    if (filtro?.evaluacionId) {
      query.evaluacionId = new Types.ObjectId(filtro.evaluacionId);
    }

    if (filtro?.accion) {
      query.accion = { $regex: filtro.accion, $options: 'i' };
    }

    if (filtro?.fechaDesde || filtro?.fechaHasta) {
      query.fechaAccion = {};
      if (filtro.fechaDesde) {
        query.fechaAccion.$gte = new Date(filtro.fechaDesde);
      }
      if (filtro.fechaHasta) {
        query.fechaAccion.$lte = new Date(filtro.fechaHasta);
      }
    }

    const limit = filtro?.limite || 50;
    const skip = filtro?.pagina ? (filtro.pagina - 1) * limit : 0;

    return await this.historialModel
      .find(query)
      .sort({ fechaAccion: -1 })
      .limit(limit)
      .skip(skip)
      .populate('usuarioId', 'nombre email')
      .populate('proyectoId', 'titulo')
      .populate('evaluacionId', 'titulo')
      .exec();
  }

  async obtenerPorUsuario(
    usuarioId: string,
    limite = 50,
  ): Promise<Historial[]> {
    if (!Types.ObjectId.isValid(usuarioId)) {
      throw new Error('ID de usuario inválido');
    }

    return await this.historialModel
      .find({ usuarioId: new Types.ObjectId(usuarioId) })
      .sort({ fechaAccion: -1 })
      .limit(limite)
      .populate('proyectoId', 'titulo')
      .populate('evaluacionId', 'titulo')
      .exec();
  }

  async obtenerPorProyecto(
    proyectoId: string,
    limite = 50,
  ): Promise<Historial[]> {
    if (!Types.ObjectId.isValid(proyectoId)) {
      throw new Error('ID de proyecto inválido');
    }

    return await this.historialModel
      .find({ proyectoId: new Types.ObjectId(proyectoId) })
      .sort({ fechaAccion: -1 })
      .limit(limite)
      .populate('usuarioId', 'nombre email')
      .populate('evaluacionId', 'titulo')
      .exec();
  }

  async obtenerPorEvaluacion(
    evaluacionId: string,
    limite = 50,
  ): Promise<Historial[]> {
    if (!Types.ObjectId.isValid(evaluacionId)) {
      throw new Error('ID de evaluación inválido');
    }

    return await this.historialModel
      .find({ evaluacionId: new Types.ObjectId(evaluacionId) })
      .sort({ fechaAccion: -1 })
      .limit(limite)
      .populate('usuarioId', 'nombre email')
      .populate('proyectoId', 'titulo')
      .exec();
  }

  async obtenerRecientes(limite = 20): Promise<Historial[]> {
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await this.historialModel
      .find({ fechaAccion: { $gte: hace24Horas } })
      .sort({ fechaAccion: -1 })
      .limit(limite)
      .populate('usuarioId', 'nombre email')
      .populate('proyectoId', 'titulo')
      .populate('evaluacionId', 'titulo')
      .exec();
  }

  async obtenerPorAccion(accion: string, limite = 50): Promise<Historial[]> {
    return await this.historialModel
      .find({ accion: { $regex: accion, $options: 'i' } })
      .sort({ fechaAccion: -1 })
      .limit(limite)
      .populate('usuarioId', 'nombre email')
      .populate('proyectoId', 'titulo')
      .populate('evaluacionId', 'titulo')
      .exec();
  }

  async contarPorUsuario(usuarioId: string): Promise<number> {
    if (!Types.ObjectId.isValid(usuarioId)) {
      throw new Error('ID de usuario inválido');
    }

    return await this.historialModel
      .countDocuments({ usuarioId: new Types.ObjectId(usuarioId) })
      .exec();
  }

  async obtenerEstadisticas(): Promise<any> {
    const estadisticas = await this.historialModel.aggregate([
      {
        $group: {
          _id: '$accion',
          total: { $sum: 1 },
          ultimaAccion: { $max: '$fechaAccion' },
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    const totalAcciones = await this.historialModel.countDocuments();
    const accionesHoy = await this.historialModel.countDocuments({
      fechaAccion: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    return {
      totalAcciones,
      accionesHoy,
      accionesPorTipo: estadisticas,
    };
  }

  async eliminarAntiguos(diasAntiguedad = 365): Promise<number> {
    const fechaLimite = new Date(
      Date.now() - diasAntiguedad * 24 * 60 * 60 * 1000,
    );

    const resultado = await this.historialModel
      .deleteMany({ fechaAccion: { $lt: fechaLimite } })
      .exec();

    return resultado.deletedCount || 0;
  }
}
