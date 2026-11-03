import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema.js';

export type AppointmentDocument = HydratedDocument<Appointment>;

// Turno que la persona anota en su agenda personal (lo sacó por teléfono,
// en la clínica, etc.). El profesional no necesita tener cuenta en la app.
@Schema({ timestamps: true })
export class Appointment {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  usuarioId: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 120 })
  profesional: string;

  @Prop({ trim: true, maxlength: 120 })
  especialidad?: string;

  @Prop({ trim: true, maxlength: 200 })
  lugar?: string;

  @Prop({ type: Date, required: true })
  fecha: Date;

  @Prop({ trim: true, maxlength: 500 })
  motivo?: string;

  @Prop({ default: false })
  asistido: boolean;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
