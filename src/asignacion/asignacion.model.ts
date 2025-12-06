import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AsignacionDocument = Asignacion & Document;

@Schema({ timestamps: true, collection: 'asignaciones' })
export class Asignacion {
  @Prop({ type: Types.ObjectId, ref: 'Proyecto', required: true })
  proyectoId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  evaluadorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  estudianteId: Types.ObjectId;

  @Prop({
    default: 'PENDIENTE',
    enum: ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA'],
  })
  estado: string;

  @Prop({ type: String, required: false })
  observaciones?: string;

  @Prop({ type: Types.ObjectId, ref: 'Evaluacion', required: false })
  evaluacionId?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  fechaCompletado?: Date;

  @Prop({
    type: String,
    enum: ['creacion', 'ficha', 'manual'],
    required: false,
  })
  origen?: string;

  // Virtual para proyecto
  proyecto?: any;

  // Virtual para evaluador
  evaluador?: any;

  // Virtual para estudiante
  estudiante?: any;

  // Virtual para evaluacion
  evaluacion?: any;

  // Timestamps automáticos
  createdAt?: Date;
  updatedAt?: Date;
}

export const AsignacionSchema = SchemaFactory.createForClass(Asignacion);

// Configurar virtuals para populate
AsignacionSchema.virtual('proyecto', {
  ref: 'Proyecto',
  localField: 'proyectoId',
  foreignField: '_id',
  justOne: true,
});

AsignacionSchema.virtual('evaluador', {
  ref: 'Usuario',
  localField: 'evaluadorId',
  foreignField: '_id',
  justOne: true,
});

AsignacionSchema.virtual('estudiante', {
  ref: 'Usuario',
  localField: 'estudianteId',
  foreignField: '_id',
  justOne: true,
});

AsignacionSchema.virtual('evaluacion', {
  ref: 'Evaluacion',
  localField: 'evaluacionId',
  foreignField: '_id',
  justOne: true,
});

// Asegurar que los virtuals se incluyan en JSON
AsignacionSchema.set('toJSON', { virtuals: true });
AsignacionSchema.set('toObject', { virtuals: true });
