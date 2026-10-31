import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

// Prueba el límite de intentos del login (protección contra fuerza bruta).
// Baja el límite a 3 con THROTTLE_LIMIT y arma una app nueva en cada test, para
// que el contador de intentos arranque de cero. Deja el valor como estaba al final.
describe('Límite de intentos / login (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  const LIMITE = 3;
  let limiteAnterior: string | undefined;

  const usuario = { email: 'brute@appsalud.com', password: 'Secreta123' };
  const login = (password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ email: usuario.email, password });

  beforeAll(() => {
    limiteAnterior = process.env.THROTTLE_LIMIT;
    process.env.THROTTLE_LIMIT = String(LIMITE);
  });

  afterAll(() => {
    process.env.THROTTLE_LIMIT = limiteAnterior;
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    connection = app.get<Connection>(getConnectionToken());
    await connection.collection('users').deleteMany({});
    await connection.collection('users').insertOne({
      nombre: 'Víctima',
      email: usuario.email,
      password: await bcrypt.hash(usuario.password, 10),
      rol: 'paciente',
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('corta los intentos de fuerza bruta: tras el límite responde 429', async () => {
    // Los primeros intentos (hasta el límite) se procesan y dan 401 por contraseña mala
    for (let i = 0; i < LIMITE; i++) {
      await login('adivinando' + i).expect(401);
    }

    // El siguiente ya no se procesa: 429 "demasiados intentos"
    const bloqueado = await login('adivinando-mas').expect(429);
    const respuesta = JSON.stringify(bloqueado.body) + bloqueado.text;
    expect(respuesta).toMatch(/too many requests/i);
  });

  it('una vez bloqueado, ni la contraseña correcta entra (bloquea por intentos, no por acierto)', async () => {
    for (let i = 0; i < LIMITE; i++) {
      await login('mala' + i).expect(401);
    }

    // Aunque ahora mande la contraseña correcta, sigue bloqueado
    const res = await login(usuario.password).expect(429);
    expect(res.body).not.toHaveProperty('access_token');
  });

  it('dentro del límite, un usuario que se equivoca y reintenta bien, entra', async () => {
    await login('me-equivoque').expect(401);
    const res = await login(usuario.password).expect(200);
    expect(res.body).toHaveProperty('access_token');
  });
});
