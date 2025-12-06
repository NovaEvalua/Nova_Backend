import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EstadoProyecto } from '../common/enums/estado-proyecto.enum';

export type ProyectoDocument = Proyecto & Document;

@Schema({
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
  collection: 'proyectos',
})
export class Proyecto {
  // _id será autogenerado por Mongoose; no lo definimos explícitamente para evitar conflictos
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  nombre: string;

  @Prop({ required: true, trim: true, maxlength: 2000 })
  descripcion: string;

  @Prop({ type: [Types.ObjectId], ref: 'Usuario', default: [] })
  instructoresIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  instructoresNombres: string[];

  @Prop({ type: Date })
  fechaEntrega?: Date;

  @Prop({ type: String })
  formato?: string;

  @Prop({ type: String })
  requisitos?: string;

  @Prop({
    type: String,
    enum: Object.values(EstadoProyecto),
    default: EstadoProyecto.BORRADOR,
    index: true,
  })
  estado: EstadoProyecto;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  creadorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  evaluadorAsignadoId?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], default: [], index: true })
  evaluadoresAsignadosIds?: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Ficha', index: true })
  fichaId?: Types.ObjectId; // compatibilidad hacia atrás (primera ficha)

  @Prop({ type: [Types.ObjectId], ref: 'Ficha', default: [], index: true })
  fichasIds?: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], default: [] })
  evaluacionesIds: Types.ObjectId[];

  @Prop({ type: Date })
  fechaCreacion: Date;

  @Prop({ type: Date })
  fechaActualizacion: Date;

  // Métodos virtuales
  get id(): string {
    return this._id.toHexString();
  }

  // Método para verificar si el proyecto está activo
  estaActivo(): boolean {
    return this.estado === EstadoProyecto.ACTIVO;
  }

  // Método para verificar si el proyecto está completado
  estaCompletado(): boolean {
    return this.estado === EstadoProyecto.COMPLETADO;
  }

  // Método para verificar si el proyecto puede ser editado
  puedeSerEditado(): boolean {
    return this.estado === EstadoProyecto.BORRADOR;
  }

  // Método para obtener el número de evaluaciones
  get numeroEvaluaciones(): number {
    return this.evaluacionesIds?.length || 0;
  }
}

export const ProyectoSchema = SchemaFactory.createForClass(Proyecto);

// Índices para optimización de consultas
ProyectoSchema.index({ creadorId: 1, estado: 1 });
ProyectoSchema.index({ evaluadorAsignadoId: 1, estado: 1 });
ProyectoSchema.index({ evaluadoresAsignadosIds: 1, estado: 1 });
ProyectoSchema.index({ nombre: 'text', descripcion: 'text' });
ProyectoSchema.index({ fechaCreacion: -1 });

// Middleware pre-save para validaciones
ProyectoSchema.pre('save', function (next) {
  if (this.isNew) {
    this.fechaCreacion = new Date();
  }
  this.fechaActualizacion = new Date();
  next();
});

// Middleware pre-update para actualizar fechaActualizacion
ProyectoSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ fechaActualizacion: new Date() });
  next();
});

// Métodos virtuales en el esquema
ProyectoSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

ProyectoSchema.virtual('estaActivo').get(function () {
  return this.estado === EstadoProyecto.ACTIVO;
});

ProyectoSchema.virtual('estaCompletado').get(function () {
  return this.estado === EstadoProyecto.COMPLETADO;
});

ProyectoSchema.virtual('puedeSerEditado').get(function () {
  return this.estado === EstadoProyecto.BORRADOR;
});

ProyectoSchema.virtual('numeroEvaluaciones').get(function () {
  return this.evaluacionesIds?.length || 0;
});

// Virtual para instructores
ProyectoSchema.virtual('instructores', {
  ref: 'Usuario',
  localField: 'instructoresIds',
  foreignField: '_id',
});

// Configurar para incluir virtuals en JSON
ProyectoSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    (ret as any).id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

ProyectoSchema.set('toObject', { virtuals: true });
