import { useEffect, useMemo, useState } from 'react'
import { usersApi } from '../api/clients.ts'
import { errorMessage } from '../api/errorMessage.ts'

interface Medico {
  _id: string
  nombre: string
  email: string
}

export default function Medicos() {
  const [medicos, setMedicos] = useState<Medico[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    usersApi.get<Medico[]>('/users/medicos')
      .then(({ data }) => {
        if (activo) setMedicos(data)
      })
      .catch((requestError: unknown) => {
        if (activo) setError(errorMessage(requestError, 'No se pudo cargar el listado de médicos.'))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [])

  const medicosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase()
    if (!termino) return medicos
    return medicos.filter((medico) =>
      `${medico.nombre} ${medico.email}`.toLocaleLowerCase().includes(termino),
    )
  }, [busqueda, medicos])

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <p className="sobrelinea">ATENCIÓN DE SALUD</p>
          <h1>Médicos</h1>
          <p className="texto-suave">Encontrá los profesionales registrados en AppSalud.</p>
        </div>
        <label className="buscador">
          <span>Buscar médico</span>
          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Nombre o correo"
          />
        </label>
      </div>
      {cargando && <p role="status">Cargando médicos…</p>}
      {error && <p className="mensaje-error" role="alert">{error}</p>}
      {!cargando && !error && medicosFiltrados.length === 0 && (
        <div className="estado-vacio">
          <h2>{medicos.length ? 'No hay resultados' : 'Todavía no hay médicos registrados'}</h2>
          <p>{medicos.length ? 'Probá con otro nombre o correo.' : 'Cuando se registren profesionales, aparecerán en este listado.'}</p>
        </div>
      )}
      {!cargando && !error && medicosFiltrados.length > 0 && (
        <ul className="lista-medicos">
          {medicosFiltrados.map((medico) => (
            <li className="medico" key={medico._id}>
              <span className="medico-avatar" aria-hidden="true">{medico.nombre.charAt(0).toLocaleUpperCase()}</span>
              <div>
                <h2>{medico.nombre}</h2>
                <a href={`mailto:${medico.email}`}>{medico.email}</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
