import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { usersApi } from '../api/clients.ts'
import { errorMessage } from '../api/errorMessage.ts'

interface Cuenta {
  _id: string
  nombre: string
  email: string
  rol: 'paciente' | 'medico'
}

interface PersonaTurno {
  _id: string
  nombre: string
  email: string
}

interface Turno {
  _id: string
  medicoId: PersonaTurno | string
  pacienteId: PersonaTurno | string
  fecha: string
  motivo: string
  estado: 'pendiente' | 'confirmado' | 'cancelado'
}

const fechaLocalMinima = () => {
  const fecha = new Date()
  fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset())
  return fecha.toISOString().slice(0, 16)
}

const aFechaLocal = (fecha: string) => {
  const valor = new Date(fecha)
  valor.setMinutes(valor.getMinutes() - valor.getTimezoneOffset())
  return valor.toISOString().slice(0, 16)
}

const personaNombre = (persona: PersonaTurno | string) =>
  typeof persona === 'string' ? 'Profesional' : persona.nombre

export default function Agenda() {
  const [cuenta, setCuenta] = useState<Cuenta | null>(null)
  const [medicos, setMedicos] = useState<PersonaTurno[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [medicoId, setMedicoId] = useState('')
  const [fecha, setFecha] = useState('')
  const [motivo, setMotivo] = useState('')
  const [editando, setEditando] = useState<string | null>(null)
  const [fechaEdicion, setFechaEdicion] = useState('')
  const [motivoEdicion, setMotivoEdicion] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const cargarAgenda = useCallback(async () => {
    const [perfil, agenda] = await Promise.all([
      usersApi.get<Cuenta>('/users/me'),
      usersApi.get<Turno[]>('/appointments'),
    ])
    setCuenta(perfil.data)
    setTurnos(agenda.data)
    if (perfil.data.rol === 'paciente') {
      const respuestaMedicos = await usersApi.get<PersonaTurno[]>('/users/medicos')
      setMedicos(respuestaMedicos.data)
    }
  }, [])

  useEffect(() => {
    let activo = true
    void Promise.resolve()
      .then(cargarAgenda)
      .catch((requestError: unknown) => {
        if (activo) setError(errorMessage(requestError, 'No se pudo cargar la agenda.'))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => { activo = false }
  }, [cargarAgenda])

  async function enviarSolicitud(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await usersApi.post('/appointments', {
        medicoId,
        fecha: new Date(fecha).toISOString(),
        motivo,
      })
      setFecha('')
      setMotivo('')
      await cargarAgenda()
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo solicitar el turno.'))
    } finally {
      setEnviando(false)
    }
  }

  async function cancelarTurno(id: string) {
    setError('')
    try {
      await usersApi.delete(`/appointments/${id}`)
      await cargarAgenda()
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo cancelar el turno.'))
    }
  }

  async function cambiarEstado(id: string, estado: 'confirmado' | 'cancelado') {
    setError('')
    try {
      await usersApi.patch(`/appointments/${id}/estado`, { estado })
      await cargarAgenda()
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo actualizar el turno.'))
    }
  }

  function iniciarEdicion(turno: Turno) {
    setEditando(turno._id)
    setFechaEdicion(aFechaLocal(turno.fecha))
    setMotivoEdicion(turno.motivo)
  }

  async function guardarEdicion(id: string) {
    setError('')
    try {
      await usersApi.patch(`/appointments/${id}`, {
        fecha: new Date(fechaEdicion).toISOString(),
        motivo: motivoEdicion,
      })
      setEditando(null)
      await cargarAgenda()
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo modificar el turno.'))
    }
  }

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <p className="sobrelinea">ORGANIZÁ TU ATENCIÓN</p>
          <h1>Agenda de médicos</h1>
          <p className="texto-suave">
            {cuenta?.rol === 'medico'
              ? 'Revisá las solicitudes y administrá tus turnos.'
              : 'Solicitá un turno y consultá tus próximas visitas.'}
          </p>
        </div>
      </div>

      {error && <p className="mensaje-error" role="alert">{error}</p>}
      {cargando && <p role="status">Cargando agenda…</p>}

      {!cargando && cuenta?.rol === 'paciente' && (
        <section className="agenda-solicitud" aria-labelledby="solicitar-turno">
          <h2 id="solicitar-turno">Solicitar un turno</h2>
          {medicos.length === 0 ? (
            <p className="texto-suave">Todavía no hay médicos registrados para solicitar un turno.</p>
          ) : (
            <form className="formulario agenda-formulario" onSubmit={enviarSolicitud}>
              <label htmlFor="turno-medico">Médico</label>
              <select
                id="turno-medico"
                required
                value={medicoId}
                onChange={(event) => setMedicoId(event.target.value)}
              >
                <option value="">Seleccioná un médico</option>
                {medicos.map((medico) => (
                  <option key={medico._id} value={medico._id}>
                    {medico.nombre}
                  </option>
                ))}
              </select>
              <label htmlFor="turno-fecha">Fecha y hora</label>
              <input
                id="turno-fecha"
                type="datetime-local"
                min={fechaLocalMinima()}
                required
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
              />
              <label htmlFor="turno-motivo">Motivo de consulta</label>
              <textarea
                id="turno-motivo"
                maxLength={500}
                required
                rows={3}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
              />
              <button className="boton boton-primario" type="submit" disabled={enviando}>
                {enviando ? 'Solicitando…' : 'Solicitar turno'}
              </button>
            </form>
          )}
        </section>
      )}

      {!cargando && (
        <section className="agenda-listado" aria-labelledby="mis-turnos">
          <h2 id="mis-turnos">{cuenta?.rol === 'medico' ? 'Turnos solicitados' : 'Mis turnos'}</h2>
          {turnos.length === 0 ? (
            <div className="estado-vacio">
              <h3>No hay turnos en la agenda</h3>
              <p>Los turnos nuevos aparecerán en esta sección.</p>
            </div>
          ) : (
            <ul className="lista-turnos">
              {turnos.map((turno) => (
                <li className="turno" key={turno._id}>
                  {editando === turno._id ? (
                    <div className="formulario turno-edicion">
                      <label htmlFor={`fecha-${turno._id}`}>Fecha y hora</label>
                      <input
                        id={`fecha-${turno._id}`}
                        type="datetime-local"
                        min={fechaLocalMinima()}
                        value={fechaEdicion}
                        onChange={(event) => setFechaEdicion(event.target.value)}
                      />
                      <label htmlFor={`motivo-${turno._id}`}>Motivo</label>
                      <textarea
                        id={`motivo-${turno._id}`}
                        maxLength={500}
                        rows={2}
                        value={motivoEdicion}
                        onChange={(event) => setMotivoEdicion(event.target.value)}
                      />
                      <div className="acciones">
                        <button className="boton boton-primario" type="button" onClick={() => guardarEdicion(turno._id)}>
                          Guardar cambios
                        </button>
                        <button className="boton" type="button" onClick={() => setEditando(null)}>
                          Descartar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="turno-contenido">
                        <div className="turno-titulo">
                          <h3>{cuenta?.rol === 'medico' ? personaNombre(turno.pacienteId) : personaNombre(turno.medicoId)}</h3>
                          <span className={`estado-turno estado-${turno.estado}`}>{turno.estado}</span>
                        </div>
                        <p className="turno-fecha">
                          {new Intl.DateTimeFormat('es-AR', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                          }).format(new Date(turno.fecha))}
                        </p>
                        <p className="turno-motivo">{turno.motivo}</p>
                      </div>
                      <div className="acciones turno-acciones">
                        {cuenta?.rol === 'paciente' && turno.estado === 'pendiente' && (
                          <button className="boton" type="button" onClick={() => iniciarEdicion(turno)}>
                            Modificar
                          </button>
                        )}
                        {cuenta?.rol === 'paciente' && turno.estado !== 'cancelado' && (
                          <button className="boton boton-peligro" type="button" onClick={() => cancelarTurno(turno._id)}>
                            Cancelar
                          </button>
                        )}
                        {cuenta?.rol === 'medico' && turno.estado === 'pendiente' && (
                          <button className="boton boton-primario" type="button" onClick={() => cambiarEstado(turno._id, 'confirmado')}>
                            Confirmar
                          </button>
                        )}
                        {cuenta?.rol === 'medico' && turno.estado !== 'cancelado' && (
                          <button className="boton boton-peligro" type="button" onClick={() => cambiarEstado(turno._id, 'cancelado')}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  )
}
