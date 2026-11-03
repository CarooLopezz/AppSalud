import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { usersApi } from '../api/clients.ts'
import { errorMessage } from '../api/errorMessage.ts'
import { listarProximosControles, type Estudio } from '../api/estudios.ts'
import ProximosControles from '../components/ProximosControles.tsx'

// Turno que la persona anota en su agenda personal
interface Turno {
  _id: string
  profesional: string
  especialidad?: string
  lugar?: string
  fecha: string
  motivo?: string
  asistido: boolean
}

const formularioVacio = {
  profesional: '',
  especialidad: '',
  lugar: '',
  fecha: '',
  motivo: '',
}

const aFechaLocal = (fecha: string) => {
  const valor = new Date(fecha)
  valor.setMinutes(valor.getMinutes() - valor.getTimezoneOffset())
  return valor.toISOString().slice(0, 16)
}

const formatearTurno = (fecha: string) =>
  new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(fecha))

export default function Agenda() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [controles, setControles] = useState<Estudio[]>([])
  const [formulario, setFormulario] = useState(formularioVacio)
  const [editando, setEditando] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  // Momento de la última carga: separa los turnos próximos de los pasados
  const [ahora, setAhora] = useState(0)

  const cargarTurnos = useCallback(async () => {
    const { data } = await usersApi.get<Turno[]>('/appointments')
    setTurnos(data)
    setAhora(Date.now())
  }, [])

  useEffect(() => {
    let activo = true
    // Los controles vienen de estudios-service: si falla, la agenda igual se muestra
    void listarProximosControles()
      .then((lista) => { if (activo) setControles(lista) })
      .catch(() => {})
    void Promise.resolve()
      .then(cargarTurnos)
      .catch((requestError: unknown) => {
        if (activo) setError(errorMessage(requestError, 'No se pudo cargar la agenda.'))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => { activo = false }
  }, [cargarTurnos])

  function actualizarCampo(campo: keyof typeof formularioVacio, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
  }

  function limpiarFormulario() {
    setFormulario(formularioVacio)
    setEditando(null)
  }

  async function guardarTurno(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setEnviando(true)
    const datos = { ...formulario, fecha: new Date(formulario.fecha).toISOString() }
    try {
      if (editando) await usersApi.patch(`/appointments/${editando}`, datos)
      else await usersApi.post('/appointments', datos)
      limpiarFormulario()
      await cargarTurnos()
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo guardar el turno.'))
    } finally {
      setEnviando(false)
    }
  }

  function iniciarEdicion(turno: Turno) {
    setEditando(turno._id)
    setFormulario({
      profesional: turno.profesional,
      especialidad: turno.especialidad ?? '',
      lugar: turno.lugar ?? '',
      fecha: aFechaLocal(turno.fecha),
      motivo: turno.motivo ?? '',
    })
  }

  async function eliminarTurno(id: string) {
    setError('')
    try {
      await usersApi.delete(`/appointments/${id}`)
      if (editando === id) limpiarFormulario()
      await cargarTurnos()
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo eliminar el turno.'))
    }
  }

  async function cambiarAsistencia(turno: Turno) {
    setError('')
    try {
      await usersApi.patch(`/appointments/${turno._id}`, { asistido: !turno.asistido })
      await cargarTurnos()
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo actualizar el turno.'))
    }
  }

  const proximos = turnos.filter((turno) => new Date(turno.fecha).getTime() >= ahora)
  const pasados = turnos.filter((turno) => new Date(turno.fecha).getTime() < ahora).reverse()

  function listaDeTurnos(lista: Turno[], pasado: boolean) {
    return (
      <ul className="lista-turnos">
        {lista.map((turno) => (
          <li className="turno" key={turno._id}>
            <div className="turno-contenido">
              <div className="turno-titulo">
                <h3>{turno.profesional}</h3>
                {turno.especialidad && <span className="estado-turno">{turno.especialidad}</span>}
                {turno.asistido && <span className="estado-turno estado-asistido">Asistí</span>}
              </div>
              <p className="turno-fecha">
                {formatearTurno(turno.fecha)}
                {turno.lugar && ` · ${turno.lugar}`}
              </p>
              {turno.motivo && <p className="turno-motivo">{turno.motivo}</p>}
            </div>
            <div className="acciones turno-acciones">
              {pasado && (
                <button className="boton" type="button" onClick={() => cambiarAsistencia(turno)}>
                  {turno.asistido ? 'Desmarcar' : 'Marcar como asistido'}
                </button>
              )}
              <button className="boton" type="button" onClick={() => iniciarEdicion(turno)}>
                Editar
              </button>
              <button className="boton boton-peligro" type="button" onClick={() => eliminarTurno(turno._id)}>
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <p className="sobrelinea">MI AGENDA</p>
          <h1>Mis turnos</h1>
          <p className="texto-suave">
            Anotá los turnos que sacaste para tenerlos todos en un solo lugar y no olvidarte de ninguno.
          </p>
        </div>
      </div>

      {error && <p className="mensaje-error" role="alert">{error}</p>}

      <section className="agenda-solicitud" aria-labelledby="anotar-turno">
        <h2 id="anotar-turno">{editando ? 'Editar turno' : 'Anotar un turno'}</h2>
        <form className="formulario agenda-formulario" onSubmit={guardarTurno}>
          <label htmlFor="turno-profesional">Profesional</label>
          <input
            id="turno-profesional"
            maxLength={120}
            placeholder="Ej.: Dra. Paula Ríos"
            required
            value={formulario.profesional}
            onChange={(event) => actualizarCampo('profesional', event.target.value)}
          />
          <label htmlFor="turno-especialidad">Especialidad</label>
          <input
            id="turno-especialidad"
            maxLength={120}
            placeholder="Ej.: Cardiología"
            value={formulario.especialidad}
            onChange={(event) => actualizarCampo('especialidad', event.target.value)}
          />
          <label htmlFor="turno-lugar">Lugar</label>
          <input
            id="turno-lugar"
            maxLength={200}
            placeholder="Ej.: Clínica San Martín, consultorio 4"
            value={formulario.lugar}
            onChange={(event) => actualizarCampo('lugar', event.target.value)}
          />
          <label htmlFor="turno-fecha">Fecha y hora</label>
          <input
            id="turno-fecha"
            type="datetime-local"
            required
            value={formulario.fecha}
            onChange={(event) => actualizarCampo('fecha', event.target.value)}
          />
          <label htmlFor="turno-motivo">Motivo o notas</label>
          <textarea
            id="turno-motivo"
            maxLength={500}
            rows={3}
            placeholder="Ej.: Llevar el electrocardiograma"
            value={formulario.motivo}
            onChange={(event) => actualizarCampo('motivo', event.target.value)}
          />
          <div className="acciones">
            <button className="boton boton-primario" type="submit" disabled={enviando}>
              {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar turno'}
            </button>
            {editando && (
              <button className="boton" type="button" onClick={limpiarFormulario}>
                Descartar
              </button>
            )}
          </div>
        </form>
      </section>

      <div className="agenda-controles">
        <ProximosControles controles={controles} cargando={cargando} />
      </div>

      {cargando && <p role="status">Cargando agenda…</p>}

      {!cargando && (
        <section className="agenda-listado" aria-labelledby="proximos-turnos">
          <h2 id="proximos-turnos">Próximos turnos</h2>
          {proximos.length === 0 ? (
            <div className="estado-vacio">
              <h3>No tenés turnos próximos</h3>
              <p>Los turnos que anotes aparecerán en esta sección, ordenados por fecha.</p>
            </div>
          ) : (
            listaDeTurnos(proximos, false)
          )}
        </section>
      )}

      {!cargando && pasados.length > 0 && (
        <section className="agenda-listado" aria-labelledby="turnos-pasados">
          <h2 id="turnos-pasados">Turnos pasados</h2>
          {listaDeTurnos(pasados, true)}
        </section>
      )}
    </section>
  )
}
