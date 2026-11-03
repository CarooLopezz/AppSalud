import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TodosLosErroresFilter } from './todos-los-errores.filter.js';

describe('TodosLosErroresFilter', () => {
  let filtro: TodosLosErroresFilter;
  let reply: ReturnType<typeof vi.fn>;
  let warn: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;

  const req = {
    method: 'POST',
    url: '/auth/login?token=secreto',
    body: { email: 'ana@appsalud.com', password: 'Secreta123' },
    headers: { authorization: 'Bearer token-secreto' },
  };

  const hostHttp = {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}) }),
  } as unknown as ArgumentsHost;

  // Todo lo que se anotó en el log, en un solo texto
  const anotado = () =>
    [...warn.mock.calls, ...error.mock.calls].flat().map(String).join(' ');

  beforeEach(() => {
    reply = vi.fn();
    const adapterHost = {
      httpAdapter: {
        reply,
        getRequestMethod: (r: typeof req) => r.method,
        getRequestUrl: (r: typeof req) => r.url,
      },
    } as unknown as HttpAdapterHost;
    filtro = new TodosLosErroresFilter(adapterHost);
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    error = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it('un 4xx se anota como aviso y responde lo mismo que antes', () => {
    filtro.catch(new NotFoundException('Estudio no encontrado'), hostHttp);

    expect(warn).toHaveBeenCalledWith(
      'POST /auth/login → 404: Estudio no encontrado',
    );
    expect(error).not.toHaveBeenCalled();
    expect(reply).toHaveBeenCalledWith(
      {},
      { statusCode: 404, message: 'Estudio no encontrado', error: 'Not Found' },
      404,
    );
  });

  it('los errores de validación anotan todos los mensajes', () => {
    filtro.catch(
      new BadRequestException(['email must be an email', 'password should not be empty']),
      hostHttp,
    );

    expect(warn).toHaveBeenCalledWith(
      'POST /auth/login → 400: email must be an email; password should not be empty',
    );
  });

  it('un error inesperado se anota como 500 con el detalle, pero no se lo muestra al usuario', () => {
    filtro.catch(new Error('se cayó la base de datos'), hostHttp);

    expect(error).toHaveBeenCalledWith(
      'POST /auth/login → 500',
      expect.stringContaining('se cayó la base de datos'),
    );
    expect(reply).toHaveBeenCalledWith(
      {},
      { statusCode: 500, message: 'Error interno del servidor' },
      500,
    );
    expect(JSON.stringify(reply.mock.calls)).not.toContain('base de datos');
  });

  it('no anota la contraseña, el token ni la query del pedido', () => {
    filtro.catch(new BadRequestException('datos inválidos'), hostHttp);
    filtro.catch(new Error('falla'), hostHttp);

    const log = anotado();
    expect(log).not.toContain('Secreta123');
    expect(log).not.toContain('token-secreto');
    expect(log).not.toContain('token=secreto');
    expect(log).not.toContain('ana@appsalud.com');
  });

  it('en GraphQL anota el error y lo devuelve para que lo responda Apollo', () => {
    const hostGql = {
      getType: () => 'graphql',
      getArgByIndex: () => ({ parentType: 'Query', fieldName: 'receta' }),
    } as unknown as ArgumentsHost;
    const e = new NotFoundException('Receta no encontrada');

    expect(filtro.catch(e, hostGql)).toBe(e);
    expect(warn).toHaveBeenCalledWith('GraphQL Query.receta → 404: Receta no encontrada');
    expect(reply).not.toHaveBeenCalled();
  });
});
