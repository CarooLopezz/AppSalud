import { IsIn } from 'class-validator';
import { EstadoTurno } from '../appointment.schema.js';

export class UpdateAppointmentStatusDto {
  @IsIn([EstadoTurno.CONFIRMADO, EstadoTurno.CANCELADO])
  estado: EstadoTurno.CONFIRMADO | EstadoTurno.CANCELADO;
}
