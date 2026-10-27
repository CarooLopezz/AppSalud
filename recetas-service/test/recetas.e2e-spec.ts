import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ObjectId } from 'mongodb';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

// Tests del CRUD de recetas (GraphQL), la relación con medicamentos, el adjunto
// de archivo (AP-89) y las alertas por vencer (AP-90). Base de prueba aparte.
describe('Recetas (e2e)', () => {
  let app: INestApplication<App>;
  let connection: Connection;
  let medicamentoId: string;

  const base = {
    pacienteId: 'paciente-1',
    dosis: '1 comprimido',
    frecuencia: 'cada 8 horas',
    duracion: '7 días',
    fecha: '2026-09-15',
  };

  // Manda una operación GraphQL y devuelve el cuerpo { data, errors }
  const gql = (query: string, variables?: object) =>
    request(app.getHttpServer()).post('/graphql').send({ query, variables });

  const crear = (input: object) =>
    gql(
      `mutation ($input: CreateRecetaInput!) {
        crearReceta(input: $input) { id dosis duracion archivo tipoArchivo medicamento { nombre } }
      }`,
      { input: { medicamentoId, ...input } },
    );

  // Fecha (YYYY-MM-DD) tal que fecha + dias caiga dentro de `enDias` desde hoy
  const fechaQueVenceEn = (enDias: number, duracionDias: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + enDias - duracionDias);
    return d.toISOString().slice(0, 10);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    connection = app.get<Connection>(getConnectionToken());

    await connection.collection('medicamentos').deleteMany({});
    const med = await connection
      .collection('medicamentos')
      .insertOne({ nombre: 'Ibuprofeno', presentacion: '400 mg' });
    medicamentoId = med.insertedId.toString();
  });

  beforeEach(async () => {
    await connection.collection('recetas').deleteMany({});
  });

  afterAll(async () => {
    await app.close();
  });

  describe('crear y listar', () => {
    it('crea una receta y la relaciona con su medicamento', async () => {
      const res = await crear(base).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.crearReceta).toMatchObject({
        dosis: base.dosis,
        medicamento: { nombre: 'Ibuprofeno' },
      });
    });

    it('lista las recetas cargadas', async () => {
      await crear(base);
      await crear({ ...base, dosis: '2 comprimidos' });

      const res = await gql('{ recetas { dosis } }').expect(200);
      expect(res.body.data.recetas).toHaveLength(2);
    });

    it('buscar una receta que no existe da error "no encontrada"', async () => {
      const id = new ObjectId().toString();
      const res = await gql(`query ($id: ID!) { receta(id: $id) { dosis } }`, { id });

      expect(res.body.errors[0].message).toMatch(/no encontrada/i);
    });
  });

  describe('archivo adjunto (AP-89)', () => {
    it('acepta un archivo con un tipo permitido', async () => {
      const res = await crear({ ...base, archivo: 'data...', tipoArchivo: 'application/pdf' }).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.crearReceta.tipoArchivo).toBe('application/pdf');
    });

    it('rechaza un tipo de archivo no permitido', async () => {
      const res = await crear({ ...base, archivo: 'data...', tipoArchivo: 'application/x-msdownload' });

      expect(res.body.errors[0].message).toMatch(/no permitido/i);
    });

    it('rechaza indicar un tipo de archivo sin mandar el archivo', async () => {
      const res = await crear({ ...base, tipoArchivo: 'application/pdf' });

      expect(res.body.errors[0].message).toMatch(/debe enviar el archivo/i);
    });
  });

  describe('alertas por vencer (AP-90)', () => {
    it('incluye una receta que vence dentro de los próximos 3 días', async () => {
      // dura 7 días y vence mañana → entra
      await crear({ ...base, fecha: fechaQueVenceEn(1, 7), duracion: '7 días' });

      const res = await gql('{ recetasPorVencer { dosis } }').expect(200);
      expect(res.body.data.recetasPorVencer).toHaveLength(1);
    });

    it('no incluye una receta que vence mucho después', async () => {
      await crear({ ...base, fecha: fechaQueVenceEn(30, 7), duracion: '7 días' });

      const res = await gql('{ recetasPorVencer { dosis } }').expect(200);
      expect(res.body.data.recetasPorVencer).toHaveLength(0);
    });

    it('no incluye una receta ya vencida', async () => {
      await crear({ ...base, fecha: fechaQueVenceEn(-5, 7), duracion: '7 días' });

      const res = await gql('{ recetasPorVencer { dosis } }').expect(200);
      expect(res.body.data.recetasPorVencer).toHaveLength(0);
    });
  });

  describe('actualizar y eliminar', () => {
    it('actualiza una receta existente', async () => {
      const { body } = await crear(base);
      const id = body.data.crearReceta.id;

      const res = await gql(
        `mutation ($input: UpdateRecetaInput!) { actualizarReceta(input: $input) { dosis } }`,
        { input: { id, dosis: '3 comprimidos' } },
      ).expect(200);

      expect(res.body.data.actualizarReceta.dosis).toBe('3 comprimidos');
    });

    it('elimina una receta y después ya no está', async () => {
      const { body } = await crear(base);
      const id = body.data.crearReceta.id;

      const del = await gql(`mutation ($id: ID!) { eliminarReceta(id: $id) }`, { id }).expect(200);
      expect(del.body.data.eliminarReceta).toBe(true);

      const res = await gql('{ recetas { dosis } }');
      expect(res.body.data.recetas).toHaveLength(0);
    });

    it('eliminar una receta que no existe da error', async () => {
      const id = new ObjectId().toString();
      const res = await gql(`mutation ($id: ID!) { eliminarReceta(id: $id) }`, { id });

      expect(res.body.errors[0].message).toMatch(/no encontrada/i);
    });
  });
});
