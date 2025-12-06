import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReporteDocument = Reporte & Document;

export enum TipoReporte {
  EVALUACIONES = 'EVALUACIONES',
  USUARIOS = 'USUARIOS',
  PROYECTOS = 'PROYECTOS',
  CERTIFICADOS = 'CERTIFICADOS',
}

export enum EstadoReporte {
  GENERANDO = 'GENERANDO',
  COMPLETADO = 'COMPLETADO',
  ERROR = 'ERROR',
}

export enum FormatoArchivo {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}

@Schema({
  timestamps: true,
  collection: 'reportes',
})
export class Reporte {
  @Prop({ required: true, trim: true, maxlength: 200 })
  nombre: string;

  @Prop({
    required: true,
    enum: Object.values(TipoReporte),
  })
  tipo: TipoReporte;

  @Prop({ type: Object, required: true })
  parametros: any; // Filtros y configuración del reporte

  @Prop({ type: Object, default: null })
  datos: any; // Datos del reporte generado

  @Prop({ required: true, type: Types.ObjectId, ref: 'Usuario' })
  creadoPorId: Types.ObjectId;

  @Prop({
    required: true,
    enum: Object.values(EstadoReporte),
    default: EstadoReporte.GENERANDO,
  })
  estado: EstadoReporte;

  @Prop({ trim: true })
  archivoUrl?: string; // URL del archivo generado

  @Prop({ enum: Object.values(FormatoArchivo) })
  formatoArchivo?: FormatoArchivo;

  @Prop({ type: Date })
  fechaCompletado?: Date;

  @Prop({ trim: true, maxlength: 1000 })
  errorMensaje?: string;
}

export const ReporteSchema = SchemaFactory.createForClass(Reporte);

// Índices para mejorar el rendimiento
ReporteSchema.index({ creadoPorId: 1 });
ReporteSchema.index({ tipo: 1 });
ReporteSchema.index({ estado: 1 });
ReporteSchema.index({ createdAt: -1 });
ReporteSchema.index({ nombre: 'text' });

// Virtual para obtener información del creador
ReporteSchema.virtual('creadoPor', {
  ref: 'Usuario',
  localField: 'creadoPorId',
  foreignField: '_id',
  justOne: true,
});

// Middleware para actualizar fechaCompletado cuando el estado cambia a COMPLETADO
ReporteSchema.pre('save', function (next) {
  if (
    this.isModified('estado') &&
    this.estado === EstadoReporte.COMPLETADO &&
    !this.fechaCompletado
  ) {
    this.fechaCompletado = new Date();
  }
  next();
});

// Configurar para incluir virtuals en JSON
ReporteSchema.set('toJSON', { virtuals: true });
ReporteSchema.set('toObject', { virtuals: true });
