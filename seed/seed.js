// Carga datos iniciales de ejemplo en las tres bases de AppSalud.
// Se puede correr varias veces: actualiza los usuarios y medicamentos de
// ejemplo y reemplaza sus estudios, recetas y turnos, sin duplicar nada.
import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'
import { pathToFileURL } from 'node:url'

// Misma contraseña para todos los usuarios de ejemplo
export const PASSWORD = 'demo1234'

export const usuarios = [
  { nombre: 'Ana Pérez', email: 'ana@appsalud.com', rol: 'paciente' },
  { nombre: 'Juan Gómez', email: 'juan@appsalud.com', rol: 'paciente' },
  { nombre: 'Laura Méndez', email: 'laura.mendez@appsalud.com', rol: 'medico' },
]

export const medicamentos = [
  {
    nombre: 'Ibuprofeno',
    principioActivo: 'Ibuprofeno',
    presentacion: 'Comprimidos 400 mg',
    descripcion: 'Antiinflamatorio y analgésico.',
  },
  {
    nombre: 'Amoxicilina',
    principioActivo: 'Amoxicilina',
    presentacion: 'Cápsulas 500 mg',
    descripcion: 'Antibiótico de amplio espectro.',
  },
  {
    nombre: 'Enalapril',
    principioActivo: 'Enalapril maleato',
    presentacion: 'Comprimidos 10 mg',
    descripcion: 'Antihipertensivo.',
  },
  {
    nombre: 'Levotiroxina',
    principioActivo: 'Levotiroxina sódica',
    presentacion: 'Comprimidos 50 mcg',
    descripcion: 'Hormona tiroidea.',
  },
]

// Estudios y recetas de cada paciente (por email y nombre de medicamento)
export const estudiosPorPaciente = {
  'ana@appsalud.com': [
    {
      tipo: 'Análisis de sangre',
      especialidad: 'Clínica médica',
      medico: 'Dra. Laura Méndez',
      fecha: '2026-09-15',
      resultado: 'Valores dentro de los parámetros normales.',
      proximoControl: '2027-03-15',
    },
    {
      tipo: 'Electrocardiograma',
      especialidad: 'Cardiología',
      medico: 'Dr. Martín Ruiz',
      fecha: '2026-08-02',
      resultado: 'Ritmo sinusal normal.',
      notas: 'Llevar el estudio al próximo control.',
    },
    {
      tipo: 'Ecografía tiroidea',
      especialidad: 'Endocrinología',
      medico: 'Dra. Sofía Torres',
      fecha: '2026-06-20',
      resultado: 'Nódulo de 4 mm, sin cambios respecto al anterior.',
      proximoControl: '2026-12-20',
    },
  ],
  'juan@appsalud.com': [
    {
      tipo: 'Radiografía de tórax',
      especialidad: 'Neumonología',
      medico: 'Dr. Pablo Díaz',
      fecha: '2026-10-05',
      resultado: 'Sin hallazgos patológicos.',
    },
    {
      tipo: 'Control de presión arterial',
      especialidad: 'Cardiología',
      medico: 'Dr. Martín Ruiz',
      fecha: '2026-09-28',
      resultado: '135/85 mmHg.',
      notas: 'Repetir la medición en un mes.',
      proximoControl: '2026-10-28',
    },
  ],
}

export const recetasPorPaciente = {
  'ana@appsalud.com': [
    {
      medicamento: 'Levotiroxina',
      dosis: '50 mcg',
      frecuencia: 'Una vez al día, en ayunas',
      duracion: 'Tratamiento crónico',
      indicaciones: 'Tomar 30 minutos antes del desayuno.',
      fecha: '2026-06-25',
    },
    {
      medicamento: 'Ibuprofeno',
      dosis: '400 mg',
      frecuencia: 'Cada 8 horas',
      duracion: '5 días',
      indicaciones: 'Tomar con comida.',
      fecha: '2026-10-10',
    },
  ],
  'juan@appsalud.com': [
    {
      medicamento: 'Enalapril',
      dosis: '10 mg',
      frecuencia: 'Una vez al día',
      duracion: '3 meses',
      fecha: '2026-09-28',
    },
    {
      medicamento: 'Amoxicilina',
      dosis: '500 mg',
      frecuencia: 'Cada 8 horas',
      duracion: '7 días',
      indicaciones: 'Completar el tratamiento aunque desaparezcan los síntomas.',
      fecha: '2026-10-05',
    },
  ],
}

// Turnos que cada paciente anotó en su agenda personal
export const turnosPorPaciente = {
  'ana@appsalud.com': [
    {
      profesional: 'Dra. Paula Ríos',
      especialidad: 'Endocrinología',
      lugar: 'Clínica San Martín, consultorio 4',
      fecha: '2026-12-18T10:30:00-03:00',
      motivo: 'Llevar la ecografía tiroidea.',
      asistido: false,
    },
    {
      profesional: 'Dr. Martín Sosa',
      especialidad: 'Cardiología',
      lugar: 'Hospital Italiano',
      fecha: '2026-08-10T09:00:00-03:00',
      motivo: 'Revisar el electrocardiograma.',
      asistido: true,
    },
  ],
  'juan@appsalud.com': [
    {
      profesional: 'Dra. Laura Méndez',
      especialidad: 'Clínica médica',
      lugar: 'Centro Médico Norte',
      fecha: '2026-11-20T16:00:00-03:00',
      motivo: 'Control de presión arterial.',
      asistido: false,
    },
  ],
}

export async function seed({
  mongoUrl = 'mongodb://localhost:27017',
  usersDb = 'appsalud_users',
  estudiosDb = 'appsalud_estudios',
  recetasDb = 'appsalud_recetas',
} = {}) {
  const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 5000 })
  await client.connect()
  const ahora = new Date()

  try {
    // ---- Usuarios ----
    const users = client.db(usersDb).collection('users')
    const hash = await bcrypt.hash(PASSWORD, 10)
    const idPorEmail = {}
    for (const u of usuarios) {
      const doc = await users.findOneAndUpdate(
        { email: u.email },
        {
          $set: { ...u, password: hash, updatedAt: ahora },
          $setOnInsert: { createdAt: ahora },
        },
        { upsert: true, returnDocument: 'after' },
      )
      idPorEmail[u.email] = doc._id
    }

    // ---- Medicamentos ----
    const meds = client.db(recetasDb).collection('medicamentos')
    const idPorMedicamento = {}
    for (const m of medicamentos) {
      const doc = await meds.findOneAndUpdate(
        { nombre: m.nombre },
        { $set: { ...m, updatedAt: ahora }, $setOnInsert: { createdAt: ahora } },
        { upsert: true, returnDocument: 'after' },
      )
      idPorMedicamento[m.nombre] = doc._id
    }

    // ---- Estudios (estudios-service guarda usuarioId como ObjectId) ----
    const estudios = client.db(estudiosDb).collection('estudios')
    const pacientes = Object.keys(estudiosPorPaciente).map((e) => idPorEmail[e])
    await estudios.deleteMany({ usuarioId: { $in: pacientes } })
    const nuevosEstudios = Object.entries(estudiosPorPaciente).flatMap(
      ([email, lista]) =>
        lista.map((e) => ({
          ...e,
          fecha: new Date(e.fecha),
          ...(e.proximoControl && { proximoControl: new Date(e.proximoControl) }),
          usuarioId: idPorEmail[email],
          createdAt: ahora,
          updatedAt: ahora,
        })),
    )
    await estudios.insertMany(nuevosEstudios)

    // ---- Recetas (recetas-service guarda los ids como texto) ----
    const recetas = client.db(recetasDb).collection('recetas')
    const pacienteIds = Object.keys(recetasPorPaciente).map((e) =>
      idPorEmail[e].toString(),
    )
    await recetas.deleteMany({ pacienteId: { $in: pacienteIds } })
    const nuevasRecetas = Object.entries(recetasPorPaciente).flatMap(
      ([email, lista]) =>
        lista.map(({ medicamento, ...r }) => ({
          ...r,
          pacienteId: idPorEmail[email].toString(),
          medicamentoId: idPorMedicamento[medicamento].toString(),
          createdAt: ahora,
          updatedAt: ahora,
        })),
    )
    await recetas.insertMany(nuevasRecetas)

    // ---- Turnos (users-service guarda usuarioId como ObjectId) ----
    const turnos = client.db(usersDb).collection('appointments')
    const conTurnos = Object.keys(turnosPorPaciente).map((e) => idPorEmail[e])
    await turnos.deleteMany({ usuarioId: { $in: conTurnos } })
    const nuevosTurnos = Object.entries(turnosPorPaciente).flatMap(
      ([email, lista]) =>
        lista.map((t) => ({
          ...t,
          fecha: new Date(t.fecha),
          usuarioId: idPorEmail[email],
          createdAt: ahora,
          updatedAt: ahora,
        })),
    )
    await turnos.insertMany(nuevosTurnos)

    return {
      usuarios: usuarios.length,
      medicamentos: medicamentos.length,
      estudios: nuevosEstudios.length,
      recetas: nuevasRecetas.length,
      turnos: nuevosTurnos.length,
    }
  } finally {
    await client.close()
  }
}

// Solo corre si se ejecuta `node seed.js` (los tests importan seed() sin ejecutarlo)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seed({
    mongoUrl: process.env.MONGO_URL,
    usersDb: process.env.USERS_DB,
    estudiosDb: process.env.ESTUDIOS_DB,
    recetasDb: process.env.RECETAS_DB,
  })
    .then((total) => {
      console.log(`Usuarios: ${total.usuarios}`)
      console.log(`Medicamentos: ${total.medicamentos}`)
      console.log(`Estudios: ${total.estudios}`)
      console.log(`Recetas: ${total.recetas}`)
      console.log(`Turnos: ${total.turnos}`)
      console.log(`\nListo. Usuarios de ejemplo (contraseña: ${PASSWORD}):`)
      for (const u of usuarios) console.log(`  ${u.email}  (${u.rol})`)
    })
    .catch((error) => {
      console.error('No se pudieron cargar los datos:', error.message)
      process.exit(1)
    })
}
