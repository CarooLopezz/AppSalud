import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usersApi } from '../api/clients.ts'
import { errorMessage } from '../api/errorMessage.ts'

export default function Registro() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await usersApi.post('/auth/register', { nombre, email, password })
      navigate('/login', { replace: true, state: { registered: true, email } })
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo crear la cuenta. Intenta nuevamente.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="formulario-pagina">
      <h1>Crear cuenta</h1>
      <p className="texto-suave">Registrate para organizar tu información de salud.</p>
      <form className="formulario" onSubmit={handleSubmit}>
        <label htmlFor="registro-nombre">Nombre completo</label>
        <input
          id="registro-nombre"
          type="text"
          autoComplete="name"
          required
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
        />
        <label htmlFor="registro-email">Correo electrónico</label>
        <input
          id="registro-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <label htmlFor="registro-password">Contraseña</label>
        <input
          id="registro-password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <span className="ayuda-campo">Debe tener al menos 6 caracteres.</span>
        {error && <p className="mensaje-error" role="alert">{error}</p>}
        <button className="boton boton-primario" type="submit" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>
      <p className="enlace-formulario">¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link></p>
    </section>
  )
}
