import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Calificacion, CalificacionDocument } from './calificacion.model';
import {
  CrearCalificacionDto,
  ActualizarCalificacionDto,
} from './calificacion.dto';

@Injectable()
export class CalificacionService {
  constructor(
    @InjectModel(Calificacion.name)
    private calificacionModel: Model<CalificacionDocument>,
  ) {}

  async crear(
    crearCalificacionDto: CrearCalificacionDto,
    calificadoPorId: string,
  ): Promise<CalificacionDocument> {
    const calificacionData = {
      ...crearCalificacionDto,
      evaluacionId: new Types.ObjectId(crearCalificacionDto.evaluacionId),
      calificadoPorId: new Types.ObjectId(calificadoPorId),
    };

    const calificacion = new this.calificacionModel(calificacionData);
    return await calificacion.save();
  }

  async obtenerPorEvaluacion(
    evaluacionId: string,
  ): Promise<CalificacionDocument[]> {
    if (!Types.ObjectId.isValid(evaluacionId)) {
      throw new NotFoundException('ID de evaluación inválido');
    }

    return await this.calificacionModel
      .find({ evaluacionId: new Types.ObjectId(evaluacionId) })
      .exec();
  }

  async obtenerPorId(id: string): Promise<CalificacionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de calificación inválido');
    }

    const calificacion = await this.calificacionModel.findById(id).exec();

    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }

    return calificacion;
  }

  async obtenerTodas(): Promise<CalificacionDocument[]> {
    return await this.calificacionModel
      .find()
      .sort({ fechaCreacion: -1 })
      .exec();
  }

  async obtenerPorCalificador(
    calificadoPorId: string,
  ): Promise<CalificacionDocument[]> {
    if (!Types.ObjectId.isValid(calificadoPorId)) {
      throw new NotFoundException('ID de calificador inválido');
    }

    return await this.calificacionModel
      .find({ calificadoPorId: new Types.ObjectId(calificadoPorId) })
      .sort({ fechaCreacion: -1 })
      .exec();
  }

  async actualizar(
    id: string,
    actualizarCalificacionDto: ActualizarCalificacionDto,
  ): Promise<CalificacionDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de calificación inválido');
    }

    const calificacion = await this.calificacionModel
      .findByIdAndUpdate(
        id,
        { $set: actualizarCalificacionDto },
        { new: true, runValidators: true },
      )
      .exec();

    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }

    return calificacion;
  }

  async eliminar(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('ID de calificación inválido');
    }

    const resultado = await this.calificacionModel.findByIdAndDelete(id).exec();

    if (!resultado) {
      throw new NotFoundException('Calificación no encontrada');
    }
  }

  async calcularPromedioEvaluacion(evaluacionId: string): Promise<number> {
    if (!Types.ObjectId.isValid(evaluacionId)) {
      throw new NotFoundException('ID de evaluación inválido');
    }

    const resultado = await this.calificacionModel.aggregate([
      { $match: { evaluacionId: new Types.ObjectId(evaluacionId) } },
      {
        $group: {
          _id: null,
          promedio: {
            $avg: {
              $divide: ['$puntaje', '$puntajeMaximo'],
            },
          },
        },
      },
    ]);

    return resultado.length > 0 ? resultado[0].promedio * 100 : 0;
  }

  async obtenerEstadisticasEvaluacion(evaluacionId: string) {
    if (!Types.ObjectId.isValid(evaluacionId)) {
      throw new NotFoundException('ID de evaluación inválido');
    }

    const estadisticas = await this.calificacionModel.aggregate([
      { $match: { evaluacionId: new Types.ObjectId(evaluacionId) } },
      {
        $group: {
          _id: null,
          totalCalificaciones: { $sum: 1 },
          puntajePromedio: { $avg: '$puntaje' },
          puntajeMaximo: { $max: '$puntaje' },
          puntajeMinimo: { $min: '$puntaje' },
          puntajeTotalMaximo: { $sum: '$puntajeMaximo' },
          puntajeTotalObtenido: { $sum: '$puntaje' },
        },
      },
    ]);

    return estadisticas.length > 0 ? estadisticas[0] : null;
  }
}
