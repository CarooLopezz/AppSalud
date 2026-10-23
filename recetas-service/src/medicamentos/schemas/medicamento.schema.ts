import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MedicamentoDocument = HydratedDocument<Medicamento>;

@Schema({ timestamps: true })
export class Medicamento {
  @Prop({ required: true })
  nombre: string;

  @Prop()
  principioActivo?: string;

  @Prop()
  presentacion?: string;

  @Prop()
  descripcion?: string;
}

export const MedicamentoSchema = SchemaFactory.createForClass(Medicamento);
