import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CalificacionDocument = Calificacion & Document;

@Schema({
  collection: 'calificaciones',
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
})
export class Calificacion {
  @Prop({ required: true, type: Types.ObjectId })
  evaluacionId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  criterio: string;

  @Prop({ required: true, type: Number, min: 0 })
  puntaje: number;

  @Prop({ required: true, type: Number, min: 0 })
  puntajeMaximo: number;

  @Prop({ required: false, trim: true })
  comentarios?: string;

  @Prop({ required: true, type: Types.ObjectId })
  calificadoPorId: Types.ObjectId;

  // Campos de timestamp automáticos
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

export const CalificacionSchema = SchemaFactory.createForClass(Calificacion);

// Índices para mejorar el rendimiento
CalificacionSchema.index({ evaluacionId: 1 });
CalificacionSchema.index({ calificadoPorId: 1 });
CalificacionSchema.index({ evaluacionId: 1, criterio: 1 }, { unique: true });

// Validaciones personalizadas
CalificacionSchema.pre('save', function () {
  if (this.puntaje > this.puntajeMaximo) {
    throw new Error('El puntaje no puede ser mayor al puntaje máximo');
  }
});
