import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Grupo, GrupoDocument } from './grupo.model';
import { FileUpload } from '../upload/schemas/file-upload.schema';
import { CrearGrupoDto, ActualizarGrupoDto } from './grupo.dto';

@Injectable()
export class GrupoService {
  constructor(
    @InjectModel(Grupo.name) private readonly grupoModel: Model<GrupoDocument>,
    @InjectModel(FileUpload.name) private readonly fileUploadModel?: Model<any>,
  ) {}

  async crear(dto: CrearGrupoDto, creadorId?: string) {
    if (!dto.estudiantesIds || dto.estudiantesIds.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un estudiante');
    }
    const nombre = dto.nombre.trim();
    const existente = await this.grupoModel.findOne({
      proyectoId: dto.proyectoId,
      nombre: { $regex: new RegExp(`^${nombre}$`, 'i') },
    });
    if (existente) {
      throw new BadRequestException(
        'Ya existe un grupo con ese nombre en este proyecto',
      );
    }

    const grupo = new this.grupoModel({
      ...dto,
      nombre,
      estudiantesIds: dto.estudiantesIds.map((id) => new Types.ObjectId(id)),
      creadoPorId: creadorId ? new Types.ObjectId(creadorId) : undefined,
    });
    return await grupo.save();
  }

  async listarPorProyecto(proyectoId: string) {
    const grupos = await this.grupoModel
      .find({ proyectoId })
      .populate('estudiantesIds', 'nombre apellidos correo')
      .exec();

    const fileUploadModel = this.fileUploadModel;
    if (!fileUploadModel) return grupos;

    return await Promise.all(
      grupos.map(async (g) => {
        try {
          const archivos = await fileUploadModel
            .find({ relatedEntityType: 'grupo', relatedEntity: g._id })
            .sort({ uploadDate: -1 })
            .exec();
          const archivosDto = archivos.map((file) => ({
            id: file._id,
            originalName: file.originalName,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            uploadDate: file.uploadDate,
            downloadUrl: `/upload/file/${file.filename}`,
            uploadedBy: file.uploadedBy,
            relatedEntity: file.relatedEntity,
            relatedEntityType: file.relatedEntityType,
          }));
          return { ...(g.toObject ? g.toObject() : g), archivos: archivosDto };
        } catch {
          return { ...(g.toObject ? g.toObject() : g), archivos: [] };
        }
      }),
    );
  }

  async actualizar(id: string, dto: ActualizarGrupoDto) {
    const grupo = await this.grupoModel.findById(id).exec();
    if (!grupo) throw new NotFoundException('Grupo no encontrado');
    const update: any = {};
    if (dto.nombre) update.nombre = dto.nombre.trim();
    if (dto.estudiantesIds) {
      if (!dto.estudiantesIds.length) {
        throw new BadRequestException(
          'Debe haber al menos un estudiante en el grupo',
        );
      }
      update.estudiantesIds = dto.estudiantesIds.map(
        (e) => new Types.ObjectId(e),
      );
    }
    return await this.grupoModel
      .findByIdAndUpdate(id, update, { new: true })
      .populate('estudiantesIds', 'nombre apellidos correo')
      .exec();
  }

  async obtenerPorId(id: string) {
    const grupo = await this.grupoModel
      .findById(id)
      .populate('estudiantesIds', 'nombre apellidos correo')
      .exec();
    if (!grupo) throw new NotFoundException('Grupo no encontrado');
    return grupo;
  }
}
