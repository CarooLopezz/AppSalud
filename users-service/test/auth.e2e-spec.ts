import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Connection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

// Tests del registro y el login. Usan la base de prueba de vitest.config.e2e.ts
// y la vacían antes de empezar.
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let jwt: JwtService;

  const usuario = {
    nombre: 'Ana Test',
    email: 'ana.test@appsalud.com',
    password: 'Secreta123',
  };

  const registrar = (body: object) =>
    request(app.getHttpServer()).post('/auth/register').send(body);
  const login = (body: object) =>
    request(app.getHttpServer()).post('/auth/login').send(body);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Igual que en main.ts: sin esto no se validan los datos que llegan
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    connection = app.get<Connection>(getConnectionToken());
    jwt = app.get(JwtService);
    await connection.collection('users').deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('registro', () => {
    it('crea el usuario y no devuelve la contraseña', async () => {
      const res = await registrar(usuario).expect(201);

      expect(res.body).toEqual({
        id: expect.any(String),
        nombre: usuario.nombre,
        email: usuario.email,
        rol: 'paciente',
      });
      expect(JSON.stringify(res.body)).not.toContain(usuario.password);
    });

    it('guarda la contraseña encriptada, no en texto', async () => {
      const guardado = await connection
        .collection('users')
        .findOne({ email: usuario.email });

      expect(guardado?.password).not.toBe(usuario.password);
      expect(guardado?.password).toMatch(/^\$2[aby]\$/); // formato bcrypt
    });

    it('rechaza un email que ya está registrado (409)', async () => {
      const res = await registrar(usuario).expect(409);
      expect(res.body.message).toBe('El email ya está registrado');
    });

    it('rechaza el mismo email aunque cambien las mayúsculas (409)', async () => {
      await registrar({ ...usuario, email: 'ANA.TEST@appsalud.com' }).expect(409);
    });

    it('rechaza una contraseña de menos de 6 caracteres (400)', async () => {
      await registrar({ ...usuario, email: 'corta@appsalud.com', password: '123' }).expect(400);
    });

    it('rechaza un email inválido (400)', async () => {
      await registrar({ ...usuario, email: 'no-es-un-email' }).expect(400);
    });

    it('rechaza el registro sin nombre (400)', async () => {
      await registrar({ email: 'sin.nombre@appsalud.com', password: 'Secreta123' }).expect(400);
    });
  });

  describe('login', () => {
    it('con datos correctos devuelve un token con el usuario adentro', async () => {
      const res = await login({ email: usuario.email, password: usuario.password }).expect(200);

      expect(res.body).toEqual({ access_token: expect.any(String) });
      const payload = jwt.verify<{ sub: string; email: string; rol: string }>(
        res.body.access_token,
      );
      expect(payload.email).toBe(usuario.email);
      expect(payload.rol).toBe('paciente');
      expect(payload.sub).toEqual(expect.any(String));
    });

    it('con contraseña incorrecta responde 401', async () => {
      const res = await login({ email: usuario.email, password: 'otraClave' }).expect(401);
      expect(res.body).not.toHaveProperty('access_token');
    });

    it('con un email que no existe responde 401 con el mismo mensaje', async () => {
      // Mismo mensaje que con la contraseña mal: así no se puede averiguar
      // qué emails están registrados
      const malPassword = await login({ email: usuario.email, password: 'otraClave' });
      const noExiste = await login({ email: 'nadie@appsalud.com', password: 'Secreta123' }).expect(401);
      expect(noExiste.body.message).toBe(malPassword.body.message);
    });

    it('acepta el email con otras mayúsculas', async () => {
      await login({ email: 'Ana.Test@AppSalud.com', password: usuario.password }).expect(200);
    });

    it('rechaza el login sin contraseña (400)', async () => {
      await login({ email: usuario.email }).expect(400);
    });
  });
});
