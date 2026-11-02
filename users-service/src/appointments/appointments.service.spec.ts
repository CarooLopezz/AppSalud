import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Rol } from '../users/schemas/user.schema.js';
import { AppointmentsService } from './appointments.service.js';

describe('AppointmentsService', () => {
  const appointmentModel = {
    create: vi.fn(),
    findOne: vi.fn(),
  };
  const service = new AppointmentsService(appointmentModel as never);
  const usuario = {
    userId: 'user-1',
    email: 'user@example.com',
    rol: Rol.PACIENTE,
  };
  const idValido = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('anota el turno a nombre del usuario y limpia los espacios', async () => {
    appointmentModel.create.mockResolvedValue({ _id: 'appointment-1' });

    await service.create(usuario, {
      profesional: '  Dra. Paula Ríos ',
      especialidad: 'Cardiología',
      fecha: '2026-11-15T13:00:00.000Z',
      motivo: ' Llevar el electro ',
    });

    expect(appointmentModel.create).toHaveBeenCalledWith({
      profesional: 'Dra. Paula Ríos',
      especialidad: 'Cardiología',
      motivo: 'Llevar el electro',
      fecha: new Date('2026-11-15T13:00:00.000Z'),
      usuarioId: usuario.userId,
    });
  });

  it('permite anotar turnos con fecha pasada (historial)', async () => {
    appointmentModel.create.mockResolvedValue({ _id: 'appointment-1' });

    await service.create(usuario, {
      profesional: 'Dr. Sosa',
      fecha: '2020-01-01T10:00:00.000Z',
    });

    expect(appointmentModel.create).toHaveBeenCalledOnce();
  });

  it('solo busca turnos del propio usuario', async () => {
    appointmentModel.findOne.mockResolvedValue(null);

    await expect(service.findOne(usuario, idValido)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(appointmentModel.findOne).toHaveBeenCalledWith({
      _id: idValido,
      usuarioId: usuario.userId,
    });
  });

  it('rechaza un id inválido sin consultar la base de datos', async () => {
    await expect(service.remove(usuario, 'no-es-un-id')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(appointmentModel.findOne).not.toHaveBeenCalled();
  });

  it('marca un turno como asistido', async () => {
    const turno = {
      set: vi.fn(),
      save: vi.fn().mockResolvedValue({ asistido: true }),
      asistido: false,
    };
    appointmentModel.findOne.mockResolvedValue(turno);

    await service.update(usuario, idValido, { asistido: true });

    expect(turno.asistido).toBe(true);
    expect(turno.save).toHaveBeenCalledOnce();
  });

  it('elimina el turno', async () => {
    const turno = { deleteOne: vi.fn().mockResolvedValue({}) };
    appointmentModel.findOne.mockResolvedValue(turno);

    await expect(service.remove(usuario, idValido)).resolves.toEqual({
      message: 'Turno eliminado correctamente',
    });
    expect(turno.deleteOne).toHaveBeenCalledOnce();
  });
});
