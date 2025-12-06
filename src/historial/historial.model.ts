import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';

export type HistorialDocument = Historial & Document;

@Schema({
  collection: 'historial',
  timestamps: { createdAt: 'fechaAccion', updatedAt: false },
  toJSON: {
    transform: (doc, ret) => {
      (ret as any).id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    },
  },
  toObject: {
    transform: (doc, ret) => {
      (ret as any).id = ret._id;
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    },
  },
})
export class Historial {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  accion: string;

  @Prop({ required: true, trim: true })
  descripcion: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Usuario' })
  usuarioId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Proyecto', default: null })
  proyectoId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Evaluacion', default: null })
  evaluacionId?: Types.ObjectId;

  @Prop({ type: Object, default: null })
  metadatos?: any;

  @Prop({ type: Date, default: Date.now })
  fechaAccion: Date;

  // Virtual para obtener el ID como string
  get id(): string {
    return this._id.toHexString();
  }

  // Método virtual para verificar si la acción es reciente (últimas 24 horas)
  get esReciente(): boolean {
    const ahora = new Date();
    const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    return this.fechaAccion > hace24Horas;
  }

  // Método virtual para obtener el tipo de acción
  get tipoAccion(): string {
    return this.accion.split('_')[0] || this.accion;
  }
}

export const HistorialSchema = SchemaFactory.createForClass(Historial);

// Índices para optimizar consultas
HistorialSchema.index({ usuarioId: 1, fechaAccion: -1 });
HistorialSchema.index({ proyectoId: 1, fechaAccion: -1 });
HistorialSchema.index({ evaluacionId: 1, fechaAccion: -1 });
HistorialSchema.index({ accion: 1, fechaAccion: -1 });
HistorialSchema.index({ fechaAccion: -1 });

// Configurar virtuals
HistorialSchema.set('toJSON', { virtuals: true });
HistorialSchema.set('toObject', { virtuals: true });

// Middleware pre-save para validaciones adicionales
HistorialSchema.pre('save', function (next) {
  if (this.isNew) {
    this.fechaAccion = new Date();
  }
  next();
});
