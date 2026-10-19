import { Link } from 'react-router-dom'

// Pantalla provisoria para las secciones que todavía no están hechas.
// Cada módulo la reemplaza por su página real en App.tsx.
export default function EnConstruccion({ titulo }: { titulo: string }) {
  return (
    <section className="aviso">
      <h1>{titulo}</h1>
      <p>Esta sección todavía está en construcción.</p>
      <Link to="/" className="boton">
        Volver al inicio
      </Link>
    </section>
  )
}
