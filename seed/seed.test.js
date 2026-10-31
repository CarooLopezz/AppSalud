// Tests del seed. Necesitan un Mongo corriendo (por defecto en localhost:27017,
// se cambia con MONGO_URL). Usan bases propias que se borran al terminar.
import bcrypt from 'bcryptjs'
import { MongoClient, ObjectId } from 'mongodb'
import assert from 'node:assert/strict'
import { after, before, describe, test } from 'node:test'
import {
  PASSWORD,
  estudiosPorPaciente,
  medicamentos,
  recetasPorPaciente,
  seed,
  usuarios,
} from './seed.js'

const mongoUrl = process.env.MONGO_URL ?? 'mongodb://localhost:27017'
const prefijo = `appsalud_test_${Date.now()}`
const opciones = {
  mongoUrl,
  usersDb: `${prefijo}_users`,
  estudiosDb: `${prefijo}_estudios`,
  recetasDb: `${prefijo}_recetas`,
}

const totalEstudios = Object.values(estudiosPorPaciente).flat().length
const totalRecetas = Object.values(recetasPorPaciente).flat().length

let client
let users, meds, estudios, recetas

before(async () => {
  client = await new MongoClient(mongoUrl, {
    serverSelectionTimeoutMS: 5000,
  }).connect()
  users = client.db(opciones.usersDb).collection('users')
  meds = client.db(opciones.recetasDb).collection('medicamentos')
  estudios = client.db(opciones.estudiosDb).collection('estudios')
  recetas = client.db(opciones.recetasDb).collection('recetas')
})

after(async () => {
  for (const db of [opciones.usersDb, opciones.estudiosDb, opciones.recetasDb]) {
    await client.db(db).dropDatabase()
  }
  await client.close()
})

describe('seed', () => {
  test('carga los usuarios, medicamentos, estudios y recetas de ejemplo', async () => {
    const total = await seed(opciones)

    assert.deepEqual(total, {
      usuarios: usuarios.length,
      medicamentos: medicamentos.length,
      estudios: totalEstudios,
      recetas: totalRecetas,
    })
    assert.equal(await users.countDocuments(), usuarios.length)
    assert.equal(await meds.countDocuments(), medicamentos.length)
    assert.equal(await estudios.countDocuments(), totalEstudios)
    assert.equal(await recetas.countDocuments(), totalRecetas)
  })

  test('correrlo de nuevo no duplica datos', async () => {
    await seed(opciones)

    assert.equal(await users.countDocuments(), usuarios.length)
    assert.equal(await meds.countDocuments(), medicamentos.length)
    assert.equal(await estudios.countDocuments(), totalEstudios)
    assert.equal(await recetas.countDocuments(), totalRecetas)
  })

  test('guarda las contraseñas encriptadas y sirven para el login', async () => {
    for (const u of await users.find().toArray()) {
      assert.notEqual(u.password, PASSWORD)
      assert.ok(await bcrypt.compare(PASSWORD, u.password), u.email)
    }
  })

  test('cada estudio pertenece a su paciente (usuarioId como ObjectId)', async () => {
    for (const [email, lista] of Object.entries(estudiosPorPaciente)) {
      const user = await users.findOne({ email })
      const suyos = await estudios.find({ usuarioId: user._id }).toArray()

      assert.equal(suyos.length, lista.length, email)
      for (const e of suyos) {
        assert.ok(e.usuarioId instanceof ObjectId)
        assert.ok(e.fecha instanceof Date)
      }
    }
  })

  test('cada receta apunta a su paciente y a un medicamento que existe', async () => {
    for (const [email, lista] of Object.entries(recetasPorPaciente)) {
      const user = await users.findOne({ email })
      const suyas = await recetas.find({ pacienteId: user._id.toString() }).toArray()

      assert.equal(suyas.length, lista.length, email)
      for (const r of suyas) {
        assert.equal(typeof r.medicamentoId, 'string')
        const med = await meds.findOne({ _id: new ObjectId(r.medicamentoId) })
        assert.ok(med, `no existe el medicamento ${r.medicamentoId}`)
      }
    }
  })

  test('no borra los datos de otros usuarios', async () => {
    const otroId = new ObjectId()
    await estudios.insertOne({ tipo: 'Otro', usuarioId: otroId })
    await recetas.insertOne({ dosis: '1 mg', pacienteId: otroId.toString() })

    await seed(opciones)

    assert.equal(await estudios.countDocuments({ usuarioId: otroId }), 1)
    assert.equal(await recetas.countDocuments({ pacienteId: otroId.toString() }), 1)
  })
})
