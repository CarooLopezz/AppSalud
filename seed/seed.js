// Carga datos iniciales de ejemplo en las tres bases de AppSalud.
// Se puede correr varias veces: actualiza los usuarios y medicamentos de
// ejemplo y reemplaza sus estudios y recetas, sin duplicar nada.
import bcrypt from 'bcryptjs'
import { MongoClient } from 'mongodb'

const MONGO_URL = process.env.MONGO_URL ?? 'mongodb://localhost:27017'
const USERS_DB = process.env.USERS_DB ?? 'appsalud_users'
const ESTUDIOS_DB = process.env.ESTUDIOS_DB ?? 'appsalud_estudios'
const RECETAS_DB = process.env.RECETAS_DB ?? 'appsalud_recetas'

// Misma contraseña para todos los usuarios de ejemplo
const PASSWORD = 'demo1234'

const usuarios = [
  { nombre: 'Ana Pérez', email: 'ana@appsalud.com', rol: 'paciente' },
  { nombre: 'Juan Gómez', email: 'juan@appsalud.com', rol: 'paciente' },
  { nombre: 'Laura Méndez', email: 'laura.mendez@appsalud.com', rol: 'medico' },
]

const medicamentos = [
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
const estudiosPorPaciente = {
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

const recetasPorPaciente = {
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

async function main() {
  const client = new MongoClient(MONGO_URL, { serverSelectionTimeoutMS: 5000 })
  await client.connect()
  const ahora = new Date()

  try {
    // ---- Usuarios ----
    const users = client.db(USERS_DB).collection('users')
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
    console.log(`Usuarios: ${usuarios.length}`)

    // ---- Medicamentos ----
    const meds = client.db(RECETAS_DB).collection('medicamentos')
    const idPorMedicamento = {}
    for (const m of medicamentos) {
      const doc = await meds.findOneAndUpdate(
        { nombre: m.nombre },
        { $set: { ...m, updatedAt: ahora }, $setOnInsert: { createdAt: ahora } },
        { upsert: true, returnDocument: 'after' },
      )
      idPorMedicamento[m.nombre] = doc._id
    }
    console.log(`Medicamentos: ${medicamentos.length}`)

    // ---- Estudios (estudios-service guarda usuarioId como ObjectId) ----
    const estudios = client.db(ESTUDIOS_DB).collection('estudios')
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
    console.log(`Estudios: ${nuevosEstudios.length}`)

    // ---- Recetas (recetas-service guarda los ids como texto) ----
    const recetas = client.db(RECETAS_DB).collection('recetas')
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
    console.log(`Recetas: ${nuevasRecetas.length}`)

    console.log(`\nListo. Usuarios de ejemplo (contraseña: ${PASSWORD}):`)
    for (const u of usuarios) console.log(`  ${u.email}  (${u.rol})`)
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error('No se pudieron cargar los datos:', error.message)
  process.exit(1)
})
