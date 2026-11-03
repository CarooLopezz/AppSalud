import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '../api/clients.ts'
import { errorMessage } from '../api/errorMessage.ts'
import { useAuth } from '../auth/useAuth.ts'

interface Cuenta {
  _id: string
  nombre: string
  email: string
  rol: 'paciente' | 'medico'
}

const nombresRol = { paciente: 'Paciente', medico: 'Médico/a' }

export default function Perfil() {
  const { cerrarSesion } = useAuth()
  const [cuenta, setCuenta] = useState<Cuenta | null>(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    usersApi.get<Cuenta>('/users/me')
      .then(({ data }) => {
        if (activo) setCuenta(data)
      })
      .catch((requestError: unknown) => {
        if (activo) setError(errorMessage(requestError, 'No se pudieron cargar tus datos.'))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => { activo = false }
  }, [])

  return (
    <section>
      <div className="encabezado-pagina">
        <div>
          <p className="sobrelinea">TU CUENTA</p>
          <h1>Mi perfil</h1>
          <p className="texto-suave">Los datos con los que te registraste en AppSalud.</p>
        </div>
      </div>
      {cargando && <p role="status">Cargando tus datos…</p>}
      {error && <p className="mensaje-error" role="alert">{error}</p>}
      {cuenta && (
        <>
          <div className="perfil">
            <span className="medico-avatar" aria-hidden="true">{cuenta.nombre.charAt(0).toLocaleUpperCase()}</span>
            <div>
              <h2>{cuenta.nombre}</h2>
              <dl className="perfil-datos">
                <dt>Correo electrónico</dt>
                <dd>{cuenta.email}</dd>
                <dt>Tipo de cuenta</dt>
                <dd>{nombresRol[cuenta.rol]}</dd>
              </dl>
            </div>
          </div>
          <div className="acciones">
            <Link to="/estudios" className="boton boton-primario">Mis estudios</Link>
            <Link to="/agenda" className="boton">Mis turnos</Link>
            <button type="button" className="boton" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </>
      )}
    </section>
  )
}
