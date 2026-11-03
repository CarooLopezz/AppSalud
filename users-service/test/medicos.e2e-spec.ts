import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Connection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

// Tests del directorio de médicos (GET /users/medicos) y de su protección con JWT.
// Usan la base de prueba de vitest.config.e2e.ts y la vacían antes de empezar.
describe('Médicos (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let token: string;

  // Firma tokens a mano para probar casos raros (vencido, otra clave, incompleto)
  const SECRET = process.env.JWT_SECRET as string;
  const firmar = (payload: object, secret = SECRET) =>
    new JwtService({ secret }).sign(payload);
  const datosToken = { sub: '507f1f77bcf86cd799439011', email: 'x@appsalud.com', rol: 'paciente' };

  const medicos = () => request(app.getHttpServer()).get('/users/medicos');
  const conToken = (t: string) => medicos().set('Authorization', `Bearer ${t}`);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    connection = app.get<Connection>(getConnectionToken());
    const users = connection.collection('users');
    await users.deleteMany({});

    // Por la API solo se pueden crear pacientes: los médicos se cargan directo
    await users.insertMany([
      { nombre: 'Zoe Martínez', email: 'zoe@appsalud.com', password: 'hash-1', rol: 'medico' },
      { nombre: 'Bruno Díaz', email: 'bruno@appsalud.com', password: 'hash-2', rol: 'medico' },
      { nombre: 'Laura Méndez', email: 'laura@appsalud.com', password: 'hash-3', rol: 'medico' },
    ]);

    // Un paciente registrado por la API, con su token
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ nombre: 'Ana Paciente', email: 'ana@appsalud.com', password: 'Secreta123' })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ana@appsalud.com', password: 'Secreta123' })
      .expect(200);
    token = login.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('protección con token', () => {
    it('sin token responde 401', async () => {
      const res = await medicos().expect(401);
      expect(res.body.message).toBe('Se requiere iniciar sesión');
    });

    it('con un header que no es Bearer responde 401', async () => {
      await medicos().set('Authorization', `Basic ${token}`).expect(401);
    });

    it('con un token inventado responde 401', async () => {
      const res = await conToken('esto.no.es-un-token').expect(401);
      expect(res.body.message).toBe('Token inválido o vencido');
    });

    it('con un token firmado con otra clave responde 401', async () => {
      await conToken(firmar(datosToken, 'otra-clave-cualquiera')).expect(401);
    });

    it('con un token vencido responde 401', async () => {
      const vencido = firmar({ ...datosToken, exp: Math.floor(Date.now() / 1000) - 60 });
      const res = await conToken(vencido).expect(401);
      expect(res.body.message).toBe('Token inválido o vencido');
    });

    it('con un token al que le falta el rol responde 401', async () => {
      const res = await conToken(firmar({ sub: datosToken.sub, email: datosToken.email })).expect(401);
      expect(res.body.message).toBe('Token inválido');
    });
  });

  describe('listado', () => {
    it('devuelve solo los médicos, ordenados por nombre', async () => {
      const res = await conToken(token).expect(200);

      expect(res.body.map((m: { nombre: string }) => m.nombre)).toEqual([
        'Bruno Díaz',
        'Laura Méndez',
        'Zoe Martínez',
      ]);
      expect(res.body.map((m: { email: string }) => m.email)).not.toContain('ana@appsalud.com');
    });

    it('de cada médico solo muestra nombre y email (nunca la contraseña)', async () => {
      const res = await conToken(token).expect(200);

      for (const medico of res.body) {
        expect(Object.keys(medico).sort()).toEqual(['_id', 'email', 'nombre']);
      }
      expect(JSON.stringify(res.body)).not.toContain('hash-');
    });

    it('si no hay médicos devuelve una lista vacía', async () => {
      const users = connection.collection('users');
      const guardados = await users.find({ rol: 'medico' }).toArray();
      await users.deleteMany({ rol: 'medico' });

      const res = await conToken(token).expect(200);
      expect(res.body).toEqual([]);

      await users.insertMany(guardados);
    });
  });

  describe('roles', () => {
    it('nadie puede registrarse como médico mandando rol en el registro', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nombre: 'Falso Médico', email: 'falso@appsalud.com', password: 'Secreta123', rol: 'medico' })
        .expect(201);

      expect(res.body.rol).toBe('paciente');
      const guardado = await connection.collection('users').findOne({ email: 'falso@appsalud.com' });
      expect(guardado?.rol).toBe('paciente');

      const listado = await conToken(token).expect(200);
      expect(listado.body.map((m: { email: string }) => m.email)).not.toContain('falso@appsalud.com');
    });
  });
});
