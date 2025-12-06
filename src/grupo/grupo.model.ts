import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GrupoDocument = Grupo & Document;

@Schema({ collection: 'grupos', timestamps: true })
export class Grupo {
  @Prop({ required: true, trim: true })
  nombre: string;

  @Prop({ type: Types.ObjectId, ref: 'Proyecto', required: true })
  proyectoId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ficha', required: true })
  fichaId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  estudiantesIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: false })
  creadoPorId?: Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const GrupoSchema = SchemaFactory.createForClass(Grupo);

GrupoSchema.index({ proyectoId: 1, nombre: 1 }, { unique: true });
