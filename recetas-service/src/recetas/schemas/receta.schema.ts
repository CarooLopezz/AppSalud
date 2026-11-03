import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RecetaDocument = HydratedDocument<Receta>;

@Schema({ timestamps: true })
export class Receta {
  @Prop({ required: true })
  pacienteId: string;

  @Prop({ required: true })
  medicamentoId: string;

  @Prop({ required: true })
  dosis: string;

  @Prop({ required: true })
  frecuencia: string;

  @Prop({ required: true })
  duracion: string;

  @Prop()
  indicaciones?: string;

  @Prop({ required: true })
  fecha: string;

  @Prop()
  archivo?: string;

  @Prop()
  tipoArchivo?: string;
}

export const RecetaSchema = SchemaFactory.createForClass(Receta);