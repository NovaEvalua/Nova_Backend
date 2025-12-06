import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CertificadoDocument = Certificado & Document;

@Schema({
  timestamps: true,
  collection: 'certificados',
})
export class Certificado {
  @Prop({ required: true, type: Types.ObjectId })
  estudianteId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  evaluacionId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  numeroCertificado: string;

  @Prop({ required: true, type: Date })
  fechaEmision: Date;

  @Prop({ type: Date, default: null })
  fechaVencimiento: Date;

  @Prop({ default: 'ACTIVO', enum: ['ACTIVO', 'INACTIVO', 'VENCIDO'] })
  estado: string;

  @Prop({ type: String, maxlength: 500 })
  descripcion?: string;

  @Prop({ type: String, maxlength: 200 })
  institucion?: string;

  @Prop({ type: Number, min: 0, max: 100 })
  calificacionFinal?: number;
}

export const CertificadoSchema = SchemaFactory.createForClass(Certificado);

// Índices para mejorar el rendimiento
CertificadoSchema.index({ estudianteId: 1 });
CertificadoSchema.index({ evaluacionId: 1 });
CertificadoSchema.index({ numeroCertificado: 1 }, { unique: true });
CertificadoSchema.index({ fechaEmision: -1 });
CertificadoSchema.index({ estado: 1 });

// Middleware para generar número de certificado automáticamente
CertificadoSchema.pre('save', function (next) {
  if (!this.numeroCertificado) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.numeroCertificado = `CERT-${timestamp}-${random}`;
  }
  next();
});

// Método virtual para verificar si el certificado está vencido
CertificadoSchema.virtual('estaVencido').get(function () {
  if (!this.fechaVencimiento) return false;
  return new Date() > this.fechaVencimiento;
});

// Configurar para incluir virtuals en JSON
CertificadoSchema.set('toJSON', { virtuals: true });
CertificadoSchema.set('toObject', { virtuals: true });
