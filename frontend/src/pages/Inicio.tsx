import { Link } from 'react-router-dom'

const accesos = [
  {
    to: '/estudios',
    titulo: 'Estudios',
    texto: 'Guardá tus análisis y estudios médicos y consultalos cuando los necesites.',
  },
  {
    to: '/recetas',
    titulo: 'Recetas',
    texto: 'Tené a mano tus recetas y medicamentos, con sus fechas y dosis.',
  },
  {
    to: '/perfil',
    titulo: 'Mi perfil',
    texto: 'Tus datos personales y tus médicos de cabecera.',
  },
]

export default function Inicio() {
  return (
    <>
      <section className="bienvenida">
        <h1>Tus estudios, recetas y médicos en un solo lugar</h1>
        <p>
          Cargá tus estudios, guardá tus recetas y anotá los datos de tus
          médicos para tenerlos siempre a mano.
        </p>
        <div className="acciones">
          <Link to="/registro" className="boton boton-primario">
            Crear cuenta
          </Link>
          <Link to="/login" className="boton">
            Iniciar sesión
          </Link>
        </div>
      </section>

      <section aria-labelledby="accesos-titulo">
        <h2 id="accesos-titulo" className="titulo-seccion">
          ¿Qué querés hacer?
        </h2>
        <ul className="tarjetas">
          {accesos.map((a) => (
            <li key={a.to}>
              <Link to={a.to} className="tarjeta">
                <h3>{a.titulo}</h3>
                <p>{a.texto}</p>
                <span className="tarjeta-ir" aria-hidden="true">
                  Ir →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
