import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Appointment, AppointmentDocument } from './appointment.schema.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

export interface UsuarioAutenticado {
  userId: string;
  email: string;
  rol: string;
}

// Agenda personal: cada usuario anota sus propios turnos y solo ve los suyos.
@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
  ) {}

  create(usuario: UsuarioAutenticado, dto: CreateAppointmentDto) {
    return this.appointmentModel.create({
      ...this.limpiarTextos(dto),
      fecha: this.parseDate(dto.fecha),
      usuarioId: usuario.userId,
    });
  }

  findAll(usuario: UsuarioAutenticado) {
    return this.appointmentModel
      .find({ usuarioId: usuario.userId })
      .sort({ fecha: 1 })
      .lean();
  }

  findOne(usuario: UsuarioAutenticado, id: string) {
    return this.findOwn(usuario, id);
  }

  async update(usuario: UsuarioAutenticado, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOwn(usuario, id);
    appointment.set(this.limpiarTextos(dto));
    if (dto.fecha) appointment.fecha = this.parseDate(dto.fecha);
    if (dto.asistido !== undefined) appointment.asistido = dto.asistido;
    return appointment.save();
  }

  async remove(usuario: UsuarioAutenticado, id: string) {
    const appointment = await this.findOwn(usuario, id);
    await appointment.deleteOne();
    return { message: 'Turno eliminado correctamente' };
  }

  private async findOwn(usuario: UsuarioAutenticado, id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Identificador de turno inválido');
    const appointment = await this.appointmentModel.findOne({
      _id: id,
      usuarioId: usuario.userId,
    });
    if (!appointment) throw new NotFoundException('No se encontró el turno solicitado');
    return appointment;
  }

  private parseDate(value: string) {
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException('La fecha del turno no es válida');
    }
    return fecha;
  }

  // Solo copia los campos de texto que vinieron, sin espacios de más
  private limpiarTextos(dto: CreateAppointmentDto | UpdateAppointmentDto) {
    const textos: Record<string, string> = {};
    for (const campo of ['profesional', 'especialidad', 'lugar', 'motivo'] as const) {
      const valor = dto[campo];
      if (valor !== undefined) textos[campo] = valor.trim();
    }
    return textos;
  }
}
