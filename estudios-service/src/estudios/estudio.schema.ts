
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EstudioDocument = HydratedDocument<Estudio>;

@Schema({ timestamps: true })
export class Estudio {
  @Prop({ required: true, trim: true })
  tipo: string;

  @Prop({ required: true, trim: true })
  especialidad: string;

  @Prop({ required: true, trim: true })
  medico: string;

  @Prop({ required: true, type: Date })
  fecha: Date;

  @Prop({ trim: true })
  resultado?: string;

  @Prop({ trim: true })
  notas?: string;

  @Prop({ type: Date })
  proximoControl?: Date;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  usuarioId: Types.ObjectId;
}

export const EstudioSchema = SchemaFactory.createForClass(Estudio);
