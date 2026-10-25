import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Rol } from '../users/schemas/user.schema.js';
import { UsersService } from '../users/users.service.js';
import {
  Appointment,
  AppointmentDocument,
  EstadoTurno,
} from './appointment.schema.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

export interface UsuarioAutenticado {
  userId: string;
  email: string;
  rol: string;
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(usuario: UsuarioAutenticado, dto: CreateAppointmentDto) {
    if (usuario.rol !== Rol.PACIENTE) {
      throw new ForbiddenException('Solo los pacientes pueden solicitar turnos');
    }

    const fecha = this.parseFutureDate(dto.fecha);
    const medico = await this.usersService.findById(dto.medicoId);
    if (!medico || medico.rol !== Rol.MEDICO) {
      throw new NotFoundException('No se encontró el médico seleccionado');
    }

    await this.assertSlotAvailable(dto.medicoId, fecha);
    try {
      return await this.appointmentModel.create({
        pacienteId: usuario.userId,
        medicoId: dto.medicoId,
        fecha,
        motivo: dto.motivo.trim(),
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('El médico ya tiene un turno en ese horario');
      }
      throw error;
    }
  }

  findAll(usuario: UsuarioAutenticado) {
    const filtro = this.getUserFilter(usuario);
    return this.appointmentModel
      .find(filtro)
      .populate('medicoId', 'nombre email')
      .populate('pacienteId', 'nombre email')
      .sort({ fecha: 1 })
      .lean();
  }

  async findOne(usuario: UsuarioAutenticado, id: string) {
    const filtro = this.getUserFilter(usuario);
    const appointment = await this.findScoped(id, filtro);
    return appointment.populate([
      { path: 'medicoId', select: 'nombre email' },
      { path: 'pacienteId', select: 'nombre email' },
    ]);
  }

  async update(usuario: UsuarioAutenticado, id: string, dto: UpdateAppointmentDto) {
    if (usuario.rol !== Rol.PACIENTE) {
      throw new ForbiddenException('Solo el paciente puede modificar la solicitud');
    }
    const appointment = await this.findScoped(id, { pacienteId: usuario.userId });
    if (appointment.estado !== EstadoTurno.PENDIENTE) {
      throw new BadRequestException('Solo se pueden modificar turnos pendientes');
    }

    if (dto.fecha) {
      const fecha = this.parseFutureDate(dto.fecha);
      await this.assertSlotAvailable(appointment.medicoId.toString(), fecha, id);
      appointment.fecha = fecha;
    }
    if (dto.motivo !== undefined) appointment.motivo = dto.motivo.trim();
    try {
      return await appointment.save();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('El médico ya tiene un turno en ese horario');
      }
      throw error;
    }
  }

  async updateStatus(
    usuario: UsuarioAutenticado,
    id: string,
    estado: EstadoTurno.CONFIRMADO | EstadoTurno.CANCELADO,
  ) {
    if (usuario.rol !== Rol.MEDICO) {
      throw new ForbiddenException('Solo un médico puede confirmar turnos');
    }
    const appointment = await this.findScoped(id, { medicoId: usuario.userId });
    if (appointment.estado === EstadoTurno.CANCELADO) {
      throw new BadRequestException('El turno ya está cancelado');
    }
    appointment.estado = estado;
    return appointment.save();
  }

  async cancel(usuario: UsuarioAutenticado, id: string) {
    if (usuario.rol !== Rol.PACIENTE) {
      throw new ForbiddenException('Solo el paciente puede cancelar el turno');
    }
    const appointment = await this.findScoped(id, { pacienteId: usuario.userId });
    if (appointment.estado === EstadoTurno.CANCELADO) {
      throw new BadRequestException('El turno ya está cancelado');
    }
    appointment.estado = EstadoTurno.CANCELADO;
    await appointment.save();
    return { message: 'Turno cancelado correctamente' };
  }

  private getUserFilter(usuario: UsuarioAutenticado): Record<string, unknown> {
    if (usuario.rol === Rol.PACIENTE) return { pacienteId: usuario.userId };
    if (usuario.rol === Rol.MEDICO) return { medicoId: usuario.userId };
    throw new ForbiddenException('El rol no permite consultar la agenda');
  }

  private async findScoped(id: string, scope: Record<string, unknown>) {
    if (!isValidObjectId(id)) throw new BadRequestException('Identificador de turno inválido');
    const appointment = await this.appointmentModel.findOne({ _id: id, ...scope });
    if (!appointment) throw new NotFoundException('No se encontró el turno solicitado');
    return appointment;
  }

  private parseFutureDate(value: string) {
    const fecha = new Date(value);
    if (Number.isNaN(fecha.getTime()) || fecha.getTime() <= Date.now()) {
      throw new BadRequestException('La fecha del turno debe ser futura');
    }
    return fecha;
  }

  private async assertSlotAvailable(medicoId: string, fecha: Date, excludeId?: string) {
    const filtro: Record<string, unknown> = {
      medicoId,
      fecha,
      estado: { $ne: EstadoTurno.CANCELADO },
    };
    if (excludeId) filtro._id = { $ne: excludeId };

    const existente = await this.appointmentModel.exists(filtro);
    if (existente) throw new ConflictException('El médico ya tiene un turno en ese horario');
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
