import { Link } from 'react-router-dom'

export default function NoEncontrada() {
  return (
    <section className="aviso">
      <h1>Página no encontrada</h1>
      <p>La dirección que buscás no existe.</p>
      <Link to="/" className="boton">
        Volver al inicio
      </Link>
    </section>
  )
}
