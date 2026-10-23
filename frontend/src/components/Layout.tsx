import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.ts'

const secciones = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/medicos', label: 'Médicos' },
  { to: '/estudios', label: 'Estudios' },
  { to: '/recetas', label: 'Recetas' },
  { to: '/perfil', label: 'Mi perfil' },
]

export default function Layout() {
  const { token, cerrarSesion } = useAuth()

  return (
    <div className="app">
      <header className="barra">
        <NavLink to="/" className="marca">
          <span className="marca-icono" aria-hidden="true">+</span>
          AppSalud
        </NavLink>
        <nav aria-label="Secciones">
          <ul className="nav">
            {secciones.map((s) => (
              <li key={s.to}>
                <NavLink to={s.to} end={s.end}>
                  {s.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sesion">
          {token ? (
            <button className="enlace-boton" type="button" onClick={cerrarSesion}>Cerrar sesión</button>
          ) : (
            <NavLink className="enlace-boton" to="/login">Iniciar sesión</NavLink>
          )}
        </div>
      </header>

      <main className="contenido">
        <Outlet />
      </main>

      <footer className="pie">AppSalud · Agenda personal de salud</footer>
    </div>
  )
}
