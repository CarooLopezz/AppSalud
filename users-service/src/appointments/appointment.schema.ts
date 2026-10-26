import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema.js';

export enum EstadoTurno {
  PENDIENTE = 'pendiente',
  CONFIRMADO = 'confirmado',
  CANCELADO = 'cancelado',
}

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({ timestamps: true })
export class Appointment {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  pacienteId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
    index: true,
  })
  medicoId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  fecha: Date;

  @Prop({ required: true, trim: true, maxlength: 500 })
  motivo: string;

  @Prop({
    type: String,
    enum: Object.values(EstadoTurno),
    default: EstadoTurno.PENDIENTE,
  })
  estado: EstadoTurno;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);
AppointmentSchema.index(
  { medicoId: 1, fecha: 1 },
  {
    unique: true,
    partialFilterExpression: {
      estado: { $in: [EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO] },
    },
  },
);
