import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { usersApi } from '../api/clients.ts'
import { errorMessage } from '../api/errorMessage.ts'
import { useAuth } from '../auth/useAuth.ts'

interface LoginResponse {
  access_token: string
}

export default function IniciarSesion() {
  const location = useLocation()
  const loginState = location.state as { registered?: boolean; email?: string; from?: string } | null
  const [email, setEmail] = useState(loginState?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { iniciarSesion, sesionVencida } = useAuth()
  const navigate = useNavigate()
  const registrado = loginState?.registered
  const destino = loginState?.from ?? '/perfil'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setEnviando(true)
    try {
      const { data } = await usersApi.post<LoginResponse>('/auth/login', { email, password })
      iniciarSesion(data.access_token)
      navigate(destino, { replace: true })
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo iniciar sesión. Intenta nuevamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="formulario-pagina">
      <h1>Iniciar sesión</h1>
      <p className="texto-suave">Accedé a tu espacio personal de salud.</p>
      {registrado && <p className="mensaje-exito" role="status">Cuenta creada. Ya podés iniciar sesión.</p>}
      {sesionVencida && <p className="mensaje-aviso" role="status">Tu sesión venció. Volvé a ingresar para continuar.</p>}
      <form className="formulario" onSubmit={handleSubmit}>
        <label htmlFor="login-email">Correo electrónico</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="login-password">Contraseña</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="mensaje-error" role="alert">{error}</p>}
        <button className="boton boton-primario" type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <p className="enlace-formulario">¿Todavía no tenés cuenta? <Link to="/registro">Crear cuenta</Link></p>
    </section>
  )
}
