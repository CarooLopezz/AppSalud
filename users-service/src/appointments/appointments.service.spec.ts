import { BadRequestException, ConflictException } from '@nestjs/common';
import { Rol } from '../users/schemas/user.schema.js';
import { AppointmentsService } from './appointments.service.js';
import { EstadoTurno } from './appointment.schema.js';

describe('AppointmentsService', () => {
  const appointmentModel = {
    create: vi.fn(),
    exists: vi.fn(),
  };
  const usersService = {
    findById: vi.fn(),
  };
  const service = new AppointmentsService(
    appointmentModel as never,
    usersService as never,
  );
  const paciente = {
    userId: 'patient-1',
    email: 'patient@example.com',
    rol: Rol.PACIENTE,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rechaza una fecha pasada sin consultar la base de datos', async () => {
    await expect(
      service.create(paciente, {
        medicoId: 'doctor-1',
        fecha: '2020-01-01T10:00:00.000Z',
        motivo: 'Control',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(usersService.findById).not.toHaveBeenCalled();
    expect(appointmentModel.create).not.toHaveBeenCalled();
  });

  it('crea un turno futuro para un médico registrado', async () => {
    const fecha = new Date(Date.now() + 86_400_000);
    usersService.findById.mockResolvedValue({
      _id: 'doctor-1',
      rol: Rol.MEDICO,
    });
    appointmentModel.exists.mockResolvedValue(null);
    appointmentModel.create.mockResolvedValue({ _id: 'appointment-1' });

    await expect(
      service.create(paciente, {
        medicoId: 'doctor-1',
        fecha: fecha.toISOString(),
        motivo: '  Control  ',
      }),
    ).resolves.toEqual({ _id: 'appointment-1' });
    expect(appointmentModel.create).toHaveBeenCalledWith({
      pacienteId: paciente.userId,
      medicoId: 'doctor-1',
      fecha,
      motivo: 'Control',
    });
  });

  it('evita reservar un horario ocupado por el mismo médico', async () => {
    usersService.findById.mockResolvedValue({
      _id: 'doctor-1',
      rol: Rol.MEDICO,
    });
    appointmentModel.exists.mockResolvedValue({ _id: 'existing-appointment' });

    await expect(
      service.create(paciente, {
        medicoId: 'doctor-1',
        fecha: new Date(Date.now() + 86_400_000).toISOString(),
        motivo: 'Control',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(appointmentModel.exists).toHaveBeenCalledWith({
      medicoId: 'doctor-1',
      fecha: expect.any(Date),
      estado: { $ne: EstadoTurno.CANCELADO },
    });
    expect(appointmentModel.create).not.toHaveBeenCalled();
  });

  it('convierte un conflicto de índice único en un error de horario ocupado', async () => {
    usersService.findById.mockResolvedValue({
      _id: 'doctor-1',
      rol: Rol.MEDICO,
    });
    appointmentModel.exists.mockResolvedValue(null);
    appointmentModel.create.mockRejectedValue({ code: 11000 });

    await expect(
      service.create(paciente, {
        medicoId: 'doctor-1',
        fecha: new Date(Date.now() + 86_400_000).toISOString(),
        motivo: 'Control',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
})
