import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  it('returns the medical directory from the users service', async () => {
    const medicos = [{ _id: 'doctor-1', nombre: 'Dra. Ana', email: 'ana@example.com' }];
    const usersService = {
      findMedicos: vi.fn().mockResolvedValue(medicos),
    };
    const controller = new UsersController(
      usersService as unknown as UsersService,
    );

    await expect(controller.findMedicos()).resolves.toEqual(medicos);
    expect(usersService.findMedicos).toHaveBeenCalledOnce();
  });
});
