import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario, UsuarioDocument } from '../usuario/usuario.model';
import { Proyecto, ProyectoDocument } from '../proyecto/proyecto.model';
import { Evaluacion, EvaluacionDocument } from '../evaluacion/evaluacion.model';
import { Reporte, ReporteDocument } from './reporte.model';
import { CrearReporteDto } from './reporte.dto';

@Injectable()
export class ReporteService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
    @InjectModel(Proyecto.name) private proyectoModel: Model<ProyectoDocument>,
    @InjectModel(Evaluacion.name)
    private evaluacionModel: Model<EvaluacionDocument>,
    @InjectModel(Reporte.name) private reporteModel: Model<ReporteDocument>,
  ) {}

  async crear(crearReporteDto: CrearReporteDto): Promise<ReporteDocument> {
    const reporte = new this.reporteModel(crearReporteDto);
    return await reporte.save();
  }

  async obtenerTodos(): Promise<ReporteDocument[]> {
    return await this.reporteModel
      .find()
      .populate('creadoPorId', 'nombres apellidos email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async obtenerPorId(id: string): Promise<ReporteDocument> {
    const reporte = await this.reporteModel
      .findById(id)
      .populate('creadoPorId', 'nombres apellidos email')
      .exec();

    if (!reporte) {
      throw new NotFoundException(`Reporte con ID ${id} no encontrado`);
    }

    return reporte;
  }

  async obtenerReporteGeneral() {
    const totalUsuarios = await this.usuarioModel.countDocuments().exec();
    const totalProyectos = await this.proyectoModel.countDocuments().exec();
    const totalEvaluaciones = await this.evaluacionModel
      .countDocuments()
      .exec();

    const usuariosPorRol = await this.usuarioModel
      .aggregate([
        {
          $group: {
            _id: '$rol',
            cantidad: { $sum: 1 },
          },
        },
        {
          $project: {
            rol: '$_id',
            cantidad: 1,
            _id: 0,
          },
        },
      ])
      .exec();

    return {
      totalUsuarios,
      totalProyectos,
      totalEvaluaciones,
      usuariosPorRol,
    };
  }

  async obtenerReporteEvaluaciones() {
    const evaluacionesPorEstado = await this.evaluacionModel
      .aggregate([
        {
          $group: {
            _id: '$estado',
            cantidad: { $sum: 1 },
          },
        },
        {
          $project: {
            estado: '$_id',
            cantidad: 1,
            _id: 0,
          },
        },
      ])
      .exec();

    return {
      evaluacionesPorEstado,
    };
  }
}
