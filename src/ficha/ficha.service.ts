import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ficha, FichaDocument } from './schemas/ficha.schema';
import {
  CrearFichaDto,
  ActualizarFichaDto,
  FiltroFichaDto,
} from './dto/ficha.dto';
import { RolUsuario } from '../common/enums/rol-usuario.enum';

@Injectable()
export class FichaService {
  constructor(
    @InjectModel(Ficha.name)
    private fichaModel: Model<FichaDocument>,
  ) {}

  async crear(crearFichaDto: CrearFichaDto): Promise<Ficha> {
    // Verificar que no exista una ficha con el mismo número
    const fichaExistente = await this.fichaModel.findOne({
      numero: crearFichaDto.numero,
    });
    if (fichaExistente) {
      throw new ConflictException('Ya existe una ficha con este número');
    }

    // Validar fechas
    if (
      new Date(crearFichaDto.fechaInicio) >= new Date(crearFichaDto.fechaFin)
    ) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior a la fecha de fin',
      );
    }

    const nuevaFicha = new this.fichaModel(crearFichaDto);
    return await nuevaFicha.save();
  }

  async obtenerTodas(filtros?: FiltroFichaDto): Promise<Ficha[]> {
    const query: any = {};

    if (filtros) {
      if (filtros.programa) {
        query.programa = { $regex: filtros.programa, $options: 'i' };
      }
      if (filtros.nivel) {
        query.nivel = filtros.nivel;
      }
      if (filtros.modalidad) {
        query.modalidad = filtros.modalidad;
      }
      if (filtros.activa !== undefined) {
        query.activa = filtros.activa;
      }
      if (filtros.coordinadorId) {
        query.coordinadorId = filtros.coordinadorId;
      }
      if (filtros.busqueda) {
        query.$or = [
          { numero: { $regex: filtros.busqueda, $options: 'i' } },
          { nombre: { $regex: filtros.busqueda, $options: 'i' } },
          { programa: { $regex: filtros.busqueda, $options: 'i' } },
          { descripcion: { $regex: filtros.busqueda, $options: 'i' } },
        ];
      }
    }

    return await this.fichaModel
      .find(query)
      .populate('coordinador', 'nombre apellidos correo')
      .populate('instructores', 'nombre apellidos correo')
      .populate('estudiantes', 'nombre apellidos correo')
      .sort({ fechaCreacion: -1 })
      .exec();
  }

  async obtenerPorId(id: string): Promise<Ficha> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de ficha inválido');
    }

    const ficha = await this.fichaModel
      .findById(id)
      .populate('coordinador', 'nombre apellidos correo')
      .populate('instructores', 'nombre apellidos correo')
      .populate('estudiantes', 'nombre apellidos correo')
      .populate('proyectos')
      .exec();

    if (!ficha) {
      throw new NotFoundException('Ficha no encontrada');
    }

    return ficha;
  }

  async obtenerPorNumero(numero: string): Promise<Ficha> {
    const ficha = await this.fichaModel
      .findOne({ numero })
      .populate('coordinador', 'nombre apellidos correo')
      .populate('instructores', 'nombre apellidos correo')
      .populate('estudiantes', 'nombre apellidos correo')
      .exec();

    if (!ficha) {
      throw new NotFoundException('Ficha no encontrada');
    }

    return ficha;
  }

  async actualizar(
    id: string,
    actualizarFichaDto: ActualizarFichaDto,
  ): Promise<Ficha> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de ficha inválido');
    }

    // Si se está actualizando el número, verificar que no exista otra ficha con ese número
    if (actualizarFichaDto.numero) {
      const fichaExistente = await this.fichaModel.findOne({
        numero: actualizarFichaDto.numero,
        _id: { $ne: id },
      });
      if (fichaExistente) {
        throw new ConflictException('Ya existe una ficha con este número');
      }
    }

    // Validar fechas si se están actualizando
    if (actualizarFichaDto.fechaInicio && actualizarFichaDto.fechaFin) {
      if (
        new Date(actualizarFichaDto.fechaInicio) >=
        new Date(actualizarFichaDto.fechaFin)
      ) {
        throw new BadRequestException(
          'La fecha de inicio debe ser anterior a la fecha de fin',
        );
      }
    }

    const fichaActualizada = await this.fichaModel
      .findByIdAndUpdate(id, actualizarFichaDto, { new: true })
      .populate('coordinador', 'nombre apellidos correo')
      .populate('instructores', 'nombre apellidos correo')
      .populate('estudiantes', 'nombre apellidos correo')
      .exec();

    if (!fichaActualizada) {
      throw new NotFoundException('Ficha no encontrada');
    }

    return fichaActualizada;
  }

  async eliminar(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de ficha inválido');
    }

    const resultado = await this.fichaModel.findByIdAndDelete(id);
    if (!resultado) {
      throw new NotFoundException('Ficha no encontrada');
    }
  }

  async asignarInstructor(
    fichaId: string,
    instructorId: string,
  ): Promise<Ficha> {
    if (
      !Types.ObjectId.isValid(fichaId) ||
      !Types.ObjectId.isValid(instructorId)
    ) {
      throw new BadRequestException('IDs inválidos');
    }

    const ficha = await this.fichaModel.findById(fichaId);
    if (!ficha) {
      throw new NotFoundException('Ficha no encontrada');
    }

    const instructorObjectId = new Types.ObjectId(instructorId);

    // Verificar si el instructor ya está asignado
    if (ficha.instructoresIds.some((id) => id.equals(instructorObjectId))) {
      throw new ConflictException(
        'El instructor ya está asignado a esta ficha',
      );
    }

    ficha.instructoresIds.push(instructorObjectId);
    await ficha.save();

    return await this.obtenerPorId(fichaId);
  }

  async desasignarInstructor(
    fichaId: string,
    instructorId: string,
  ): Promise<Ficha> {
    if (
      !Types.ObjectId.isValid(fichaId) ||
      !Types.ObjectId.isValid(instructorId)
    ) {
      throw new BadRequestException('IDs inválidos');
    }

    const ficha = await this.fichaModel.findById(fichaId);
    if (!ficha) {
      throw new NotFoundException('Ficha no encontrada');
    }

    const instructorObjectId = new Types.ObjectId(instructorId);
    ficha.instructoresIds = ficha.instructoresIds.filter(
      (id) => !id.equals(instructorObjectId),
    );
    await ficha.save();

    return await this.obtenerPorId(fichaId);
  }

  async asignarEstudiante(
    fichaId: string,
    estudianteId: string,
  ): Promise<Ficha> {
    if (
      !Types.ObjectId.isValid(fichaId) ||
      !Types.ObjectId.isValid(estudianteId)
    ) {
      throw new BadRequestException('IDs inválidos');
    }

    const ficha = await this.fichaModel.findById(fichaId);
    if (!ficha) {
      throw new NotFoundException('Ficha no encontrada');
    }

    const estudianteObjectId = new Types.ObjectId(estudianteId);

    // Verificar si el estudiante ya está asignado
    if (ficha.estudiantesIds.some((id) => id.equals(estudianteObjectId))) {
      throw new ConflictException(
        'El estudiante ya está asignado a esta ficha',
      );
    }

    ficha.estudiantesIds.push(estudianteObjectId);
    await ficha.save();

    return await this.obtenerPorId(fichaId);
  }

  async desasignarEstudiante(
    fichaId: string,
    estudianteId: string,
  ): Promise<Ficha> {
    if (
      !Types.ObjectId.isValid(fichaId) ||
      !Types.ObjectId.isValid(estudianteId)
    ) {
      throw new BadRequestException('IDs inválidos');
    }

    const ficha = await this.fichaModel.findById(fichaId);
    if (!ficha) {
      throw new NotFoundException('Ficha no encontrada');
    }

    const estudianteObjectId = new Types.ObjectId(estudianteId);
    ficha.estudiantesIds = ficha.estudiantesIds.filter(
      (id) => !id.equals(estudianteObjectId),
    );
    await ficha.save();

    return await this.obtenerPorId(fichaId);
  }

  async obtenerFichasActivas(): Promise<Ficha[]> {
    const fechaActual = new Date();
    return await this.fichaModel
      .find({
        activa: true,
        fechaInicio: { $lte: fechaActual },
        fechaFin: { $gte: fechaActual },
      })
      .populate('coordinador', 'nombre apellidos correo')
      .sort({ fechaInicio: -1 })
      .exec();
  }

  async obtenerEstadisticas(): Promise<any> {
    const totalFichas = await this.fichaModel.countDocuments();
    const fichasActivas = await this.fichaModel.countDocuments({
      activa: true,
    });
    const fichasInactivas = totalFichas - fichasActivas;

    const estadisticasPorNivel = await this.fichaModel.aggregate([
      { $group: { _id: '$nivel', count: { $sum: 1 } } },
    ]);

    const estadisticasPorModalidad = await this.fichaModel.aggregate([
      { $group: { _id: '$modalidad', count: { $sum: 1 } } },
    ]);

    return {
      totalFichas,
      fichasActivas,
      fichasInactivas,
      estadisticasPorNivel,
      estadisticasPorModalidad,
    };
  }
}
