import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Transform } from 'class-transformer';

export type NotificacionDocument = Notificacion & Document;

export enum TipoNotificacion {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

@Schema({
  collection: 'notificaciones',
  timestamps: { createdAt: 'fechaCreacion', updatedAt: false },
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
export class Notificacion {
  @Transform(({ value }) => value.toString())
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 200 })
  titulo: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  mensaje: string;

  @Prop({
    required: true,
    enum: TipoNotificacion,
    default: TipoNotificacion.INFO,
  })
  tipo: TipoNotificacion;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Usuario' })
  usuarioId: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  leida: boolean;

  @Prop({ type: String, trim: true, default: null })
  enlace?: string;

  @Prop({ type: Object, default: null })
  metadatos?: any;

  @Prop({ type: Date, default: Date.now })
  fechaCreacion: Date;

  @Prop({ type: Date, default: null })
  fechaLeida?: Date;

  // Virtual para obtener el ID como string
  get id(): string {
    return this._id.toHexString();
  }

  // Método virtual para verificar si la notificación es reciente (últimas 24 horas)
  get esReciente(): boolean {
    const ahora = new Date();
    const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    return this.fechaCreacion > hace24Horas;
  }

  // Método virtual para verificar si la notificación es urgente
  get esUrgente(): boolean {
    return (
      this.tipo === TipoNotificacion.ERROR ||
      this.tipo === TipoNotificacion.WARNING
    );
  }

  // Método virtual para obtener el tiempo transcurrido desde la creación
  get tiempoTranscurrido(): string {
    const ahora = new Date();
    const diferencia = ahora.getTime() - this.fechaCreacion.getTime();
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (dias > 0) {
      return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    } else if (horas > 0) {
      return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    } else if (minutos > 0) {
      return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    } else {
      return 'hace un momento';
    }
  }

  // Método para marcar como leída
  marcarComoLeida(): void {
    this.leida = true;
    this.fechaLeida = new Date();
  }
}

export const NotificacionSchema = SchemaFactory.createForClass(Notificacion);

// Índices para optimizar consultas
NotificacionSchema.index({ usuarioId: 1, fechaCreacion: -1 });
NotificacionSchema.index({ usuarioId: 1, leida: 1, fechaCreacion: -1 });
NotificacionSchema.index({ tipo: 1, fechaCreacion: -1 });
NotificacionSchema.index({ fechaCreacion: -1 });
NotificacionSchema.index({ leida: 1, fechaCreacion: -1 });

// Configurar virtuals
NotificacionSchema.set('toJSON', { virtuals: true });
NotificacionSchema.set('toObject', { virtuals: true });

// Middleware pre-save para validaciones adicionales
NotificacionSchema.pre('save', function (next) {
  if (this.isNew) {
    this.fechaCreacion = new Date();
  }

  // Si se marca como leída y no tiene fecha de lectura, establecerla
  if (this.leida && !this.fechaLeida) {
    this.fechaLeida = new Date();
  }

  next();
});

// Método estático para limpiar notificaciones antiguas
NotificacionSchema.statics.limpiarAntiguas = function (diasAntiguedad = 30) {
  const fechaLimite = new Date(
    Date.now() - diasAntiguedad * 24 * 60 * 60 * 1000,
  );
  return this.deleteMany({
    fechaCreacion: { $lt: fechaLimite },
    leida: true,
  });
};
