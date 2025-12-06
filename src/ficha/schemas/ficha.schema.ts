import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FichaDocument = Ficha & Document;

@Schema({
  collection: 'fichas',
  timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Ficha {
  @Prop({ required: true, unique: true })
  numero: string;

  @Prop({ required: true })
  nombre: string;

  @Prop({ required: false })
  descripcion?: string;

  @Prop({ required: true })
  programa: string;

  @Prop({ required: true })
  nivel: string; // Técnico, Tecnólogo, Especialización

  @Prop({ required: true })
  modalidad: string; // Presencial, Virtual, Mixta

  @Prop({ required: true })
  duracionMeses: number;

  @Prop({ required: true })
  fechaInicio: Date;

  @Prop({ required: true })
  fechaFin: Date;

  @Prop({ default: true })
  activa: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  coordinadorId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  instructoresIds: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  estudiantesIds: Types.ObjectId[];

  @Prop({ default: 0 })
  capacidadMaxima: number;

  @Prop()
  sede?: string;

  @Prop()
  jornada?: string; // Mañana, Tarde, Noche, Mixta

  @Prop({ type: Object })
  competencias?: {
    especificas: string[];
    transversales: string[];
  };

  @Prop({ type: Object })
  resultadosAprendizaje?: string[];

  fechaCreacion: Date;
  fechaActualizacion: Date;
}

export const FichaSchema = SchemaFactory.createForClass(Ficha);

// Índices
FichaSchema.index({ numero: 1 }, { unique: true });
FichaSchema.index({ programa: 1 });
FichaSchema.index({ activa: 1 });
FichaSchema.index({ coordinadorId: 1 });
FichaSchema.index({ fechaInicio: 1, fechaFin: 1 });

// Virtuals para relaciones
FichaSchema.virtual('coordinador', {
  ref: 'Usuario',
  localField: 'coordinadorId',
  foreignField: '_id',
  justOne: true,
});

FichaSchema.virtual('instructores', {
  ref: 'Usuario',
  localField: 'instructoresIds',
  foreignField: '_id',
});

FichaSchema.virtual('estudiantes', {
  ref: 'Usuario',
  localField: 'estudiantesIds',
  foreignField: '_id',
});

FichaSchema.virtual('proyectos', {
  ref: 'Proyecto',
  localField: '_id',
  foreignField: 'fichaId',
});
