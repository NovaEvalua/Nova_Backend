import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EvaluacionDocument = Evaluacion & Document;

export enum TipoEvaluacion {
  EXAMEN = 'examen',
  PROYECTO = 'proyecto',
  TAREA = 'tarea',
  LABORATORIO = 'laboratorio',
  QUIZ = 'quiz',
}

export enum EstadoEvaluacion {
  BORRADOR = 'borrador',
  PUBLICADA = 'publicada',
  EN_PROGRESO = 'en_progreso',
  FINALIZADA = 'finalizada',
  CANCELADA = 'cancelada',
}

@Schema({
  timestamps: true,
  collection: 'evaluaciones',
})
export class Evaluacion {
  @Prop({ required: true, trim: true, maxlength: 200 })
  titulo: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  descripcion: string;

  @Prop({
    required: true,
    enum: Object.values(TipoEvaluacion),
    default: TipoEvaluacion.EXAMEN,
  })
  tipo: TipoEvaluacion;

  @Prop({
    required: true,
    enum: Object.values(EstadoEvaluacion),
    default: EstadoEvaluacion.BORRADOR,
  })
  estado: EstadoEvaluacion;

  @Prop({ required: true, type: Date })
  fechaInicio: Date;

  @Prop({ required: true, type: Date })
  fechaFin: Date;

  @Prop({ required: true, min: 0, max: 1000 })
  duracionMinutos: number;

  @Prop({ required: true, min: 0, max: 100 })
  puntajeMaximo: number;

  @Prop({ required: true, min: 0, max: 100, default: 60 })
  puntajeMinimo: number;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  evaluadorId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  estudiantesAsignados: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  instrucciones: string[];

  @Prop({ type: Object, default: {} })
  configuracion: {
    permitirReintentos?: boolean;
    numeroMaximoReintentos?: number;
    mostrarResultadosInmediatos?: boolean;
    barajarPreguntas?: boolean;
    limiteTiempo?: boolean;
    requiereSupervision?: boolean;
  };

  @Prop({ type: [String], default: [] })
  etiquetas: string[];

  @Prop({ trim: true, maxlength: 500 })
  observaciones?: string;

  @Prop({ default: true })
  activa: boolean;

  // Campos de auditoría
  @Prop({ type: Types.ObjectId, ref: 'Usuario' })
  creadoPor?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario' })
  modificadoPor?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  fechaCreacion: Date;

  @Prop({ type: Date, default: Date.now })
  fechaModificacion: Date;
}

export const EvaluacionSchema = SchemaFactory.createForClass(Evaluacion);

// Índices para mejorar el rendimiento
EvaluacionSchema.index({ evaluadorId: 1 });
EvaluacionSchema.index({ estado: 1 });
EvaluacionSchema.index({ tipo: 1 });
EvaluacionSchema.index({ fechaInicio: 1, fechaFin: 1 });
EvaluacionSchema.index({ estudiantesAsignados: 1 });
EvaluacionSchema.index({ titulo: 'text', descripcion: 'text' });
EvaluacionSchema.index({ activa: 1, estado: 1 });

// Middleware pre-save para actualizar fechaModificacion
EvaluacionSchema.pre('save', function (next) {
  this.fechaModificacion = new Date();
  next();
});

// Middleware pre-update para actualizar fechaModificacion
EvaluacionSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ fechaModificacion: new Date() });
  next();
});

// Métodos virtuales
EvaluacionSchema.virtual('estaActiva').get(function () {
  const ahora = new Date();
  return (
    this.activa &&
    this.estado === EstadoEvaluacion.PUBLICADA &&
    ahora >= this.fechaInicio &&
    ahora <= this.fechaFin
  );
});

EvaluacionSchema.virtual('estaVencida').get(function () {
  return new Date() > this.fechaFin;
});

EvaluacionSchema.virtual('duracionHoras').get(function () {
  return Math.round((this.duracionMinutos / 60) * 100) / 100;
});

EvaluacionSchema.virtual('numeroEstudiantes').get(function () {
  return this.estudiantesAsignados ? this.estudiantesAsignados.length : 0;
});

// Configurar virtuals en JSON
EvaluacionSchema.set('toJSON', { virtuals: true });
EvaluacionSchema.set('toObject', { virtuals: true });
