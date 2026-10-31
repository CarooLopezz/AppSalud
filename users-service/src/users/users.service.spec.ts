import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';

// Tests unitarios: la base de datos se reemplaza por un modelo simulado
describe('UsersService', () => {
  let model: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
  };
  let service: UsersService;

  const datos = { nombre: 'Ana', email: 'Ana@AppSalud.com', password: 'Secreta123' };

  beforeEach(() => {
    model = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async (doc: object) => ({ id: 'user-1', ...doc })),
      find: vi.fn(),
    };
    service = new UsersService(model as unknown as Model<UserDocument>);
  });

  describe('create', () => {
    it('guarda la contraseña encriptada con bcrypt, no en texto', async () => {
      await service.create(datos);

      const guardado = model.create.mock.calls[0][0];
      expect(guardado.password).not.toBe(datos.password);
      expect(guardado.password).toMatch(/^\$2[aby]\$/);
      expect(await bcrypt.compare(datos.password, guardado.password)).toBe(true);
    });

    it('guarda el email en minúsculas', async () => {
      await service.create(datos);

      expect(model.findOne).toHaveBeenCalledWith({ email: 'ana@appsalud.com' });
      expect(model.create.mock.calls[0][0].email).toBe('ana@appsalud.com');
    });

    it('si el email ya existe tira ConflictException y no crea nada', async () => {
      model.findOne.mockResolvedValue({ id: 'otro' });

      await expect(service.create(datos)).rejects.toThrow(ConflictException);
      expect(model.create).not.toHaveBeenCalled();
    });

    it('si Mongo rechaza el email duplicado (código 11000) también tira ConflictException', async () => {
      // Pasa si dos registros con el mismo email llegan al mismo tiempo
      model.create.mockRejectedValue({ code: 11000 });

      await expect(service.create(datos)).rejects.toThrow('El email ya está registrado');
    });

    it('cualquier otro error de Mongo se deja pasar tal cual', async () => {
      const falla = new Error('se cayó la base');
      model.create.mockRejectedValue(falla);

      await expect(service.create(datos)).rejects.toBe(falla);
    });
  });

  describe('findByEmail', () => {
    it('busca el email en minúsculas', async () => {
      await service.findByEmail('ANA@AppSalud.com');

      expect(model.findOne).toHaveBeenCalledWith({ email: 'ana@appsalud.com' });
    });
  });

  describe('findMedicos', () => {
    it('busca solo médicos, pide solo nombre y email y los ordena por nombre', async () => {
      const lean = vi.fn().mockResolvedValue([]);
      const sort = vi.fn().mockReturnValue({ lean });
      const select = vi.fn().mockReturnValue({ sort });
      model.find.mockReturnValue({ select });

      await service.findMedicos();

      expect(model.find).toHaveBeenCalledWith({ rol: 'medico' });
      expect(select).toHaveBeenCalledWith('nombre email');
      expect(sort).toHaveBeenCalledWith({ nombre: 1 });
    });
  });
});
