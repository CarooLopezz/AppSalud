import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Connection } from 'mongoose';
import { ObjectId } from 'mongodb';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

// Tests del CRUD de estudios y, sobre todo, de que cada usuario solo vea y
// toque los suyos. Usan la base de prueba de vitest.config.e2e.ts.
describe('Estudios (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;

  const SECRET = process.env.JWT_SECRET as string;
  // estudios-service no tiene usuarios: saca el id del token. Firmamos dos.
  const jwt = new JwtService({ secret: SECRET });
  const ANA = '507f1f77bcf86cd799439011';
  const JUAN = '507f1f77bcf86cd799439022';
  const tokenAna = jwt.sign({ sub: ANA, email: 'ana@appsalud.com', rol: 'paciente' });
  const tokenJuan = jwt.sign({ sub: JUAN, email: 'juan@appsalud.com', rol: 'paciente' });

  const estudio = {
    tipo: 'Análisis de sangre',
    especialidad: 'Clínica médica',
    medico: 'Dra. Laura Méndez',
    fecha: '2026-09-15',
  };

  const get = (path: string, token: string) =>
    request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${token}`);
  const post = (body: object, token: string) =>
    request(app.getHttpServer()).post('/estudios').set('Authorization', `Bearer ${token}`).send(body);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    connection = app.get<Connection>(getConnectionToken());
  });

  beforeEach(async () => {
    await connection.collection('estudios').deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('protección con token', () => {
    it('sin token responde 401', async () => {
      await request(app.getHttpServer()).get('/estudios').expect(401);
    });

    it('con un token inválido responde 401', async () => {
      await get('/estudios', 'token.falso').expect(401);
    });
  });

  describe('crear', () => {
    it('crea el estudio y lo guarda a nombre de quien lo manda', async () => {
      const res = await post(estudio, tokenAna).expect(201);

      expect(res.body).toMatchObject({ tipo: estudio.tipo, medico: estudio.medico });
      expect(res.body._id).toEqual(expect.any(String));

      const guardado = await connection.collection("estudios").findOne({ _id: new ObjectId(res.body._id) });
      expect(String(guardado?.usuarioId)).toBe(ANA);
      expect(guardado?.fecha).toBeInstanceOf(Date);
    });

    it('rechaza un estudio sin los datos obligatorios (400)', async () => {
      await post({ tipo: 'Solo tipo' }, tokenAna).expect(400);
    });

    it('rechaza una fecha que no es fecha (400)', async () => {
      await post({ ...estudio, fecha: 'no-es-fecha' }, tokenAna).expect(400);
    });
  });

  describe('listar y ver', () => {
    it('devuelve solo los estudios propios, ordenados por fecha (más nuevo primero)', async () => {
      await post({ ...estudio, fecha: '2026-01-10' }, tokenAna).expect(201);
      await post({ ...estudio, fecha: '2026-09-15' }, tokenAna).expect(201);
      await post({ ...estudio, fecha: '2026-05-20' }, tokenJuan).expect(201); // de Juan

      const res = await get('/estudios', tokenAna).expect(200);

      expect(res.body).toHaveLength(2); // los de Juan no aparecen
      expect(res.body.map((e: { fecha: string }) => e.fecha.slice(0, 10))).toEqual([
        '2026-09-15',
        '2026-01-10',
      ]);
    });

    it('un id con formato inválido da 400', async () => {
      await get('/estudios/no-es-un-id', tokenAna).expect(400);
    });

    it('un estudio que no existe da 404', async () => {
      await get(`/estudios/${JUAN}`, tokenAna).expect(404);
    });

    it('no se puede ver un estudio de otro usuario (404)', async () => {
      const { body } = await post(estudio, tokenJuan).expect(201);

      await get(`/estudios/${body._id}`, tokenJuan).expect(200); // el dueño sí
      await get(`/estudios/${body._id}`, tokenAna).expect(404); // Ana no
    });
  });

  describe('editar', () => {
    it('el dueño puede editar su estudio', async () => {
      const { body } = await post(estudio, tokenAna).expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/estudios/${body._id}`)
        .set('Authorization', `Bearer ${tokenAna}`)
        .send({ resultado: 'Todo normal' })
        .expect(200);

      expect(res.body.resultado).toBe('Todo normal');
    });

    it('no se puede editar el estudio de otro usuario (404)', async () => {
      const { body } = await post(estudio, tokenAna).expect(201);

      await request(app.getHttpServer())
        .patch(`/estudios/${body._id}`)
        .set('Authorization', `Bearer ${tokenJuan}`)
        .send({ resultado: 'Lo cambio yo' })
        .expect(404);

      const guardado = await connection.collection("estudios").findOne({ _id: new ObjectId(body._id) });
      expect(guardado?.resultado).toBeUndefined(); // no se tocó
    });
  });

  describe('eliminar', () => {
    it('el dueño elimina su estudio y recibe confirmación', async () => {
      const { body } = await post(estudio, tokenAna).expect(201);

      const res = await request(app.getHttpServer())
        .delete(`/estudios/${body._id}`)
        .set('Authorization', `Bearer ${tokenAna}`)
        .expect(200);

      expect(res.body.message).toBe('Estudio eliminado correctamente');
      await get(`/estudios/${body._id}`, tokenAna).expect(404);
    });

    it('no se puede eliminar el estudio de otro usuario (404) y queda intacto', async () => {
      const { body } = await post(estudio, tokenAna).expect(201);

      await request(app.getHttpServer())
        .delete(`/estudios/${body._id}`)
        .set('Authorization', `Bearer ${tokenJuan}`)
        .expect(404);

      await get(`/estudios/${body._id}`, tokenAna).expect(200); // sigue ahí
    });
  });
});
