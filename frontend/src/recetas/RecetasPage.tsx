
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

type Receta = {
  id: string
  pacienteId: string
  medicamentoId: string
  dosis: string
  frecuencia: string
  duracion: string
  indicaciones?: string
  fecha: string
}

const GRAPHQL_URL = 'http://localhost:3003/graphql'

function RecetasPage() {
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [recetaSeleccionada, setRecetaSeleccionada] =
    useState<Receta | null>(null)

  const [pacienteId, setPacienteId] = useState('')
  const [medicamentoId, setMedicamentoId] = useState('')
  const [dosis, setDosis] = useState('')
  const [frecuencia, setFrecuencia] = useState('')
  const [duracion, setDuracion] = useState('')
  const [indicaciones, setIndicaciones] = useState('')
  const [fecha, setFecha] = useState('')

  useEffect(() => {
    cargarRecetas()
  }, [])

  async function cargarRecetas() {
    try {
      setCargando(true)
      setError('')

      const respuesta = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            {
              recetas {
                id
                pacienteId
                medicamentoId
                dosis
                frecuencia
                duracion
                indicaciones
                fecha
              }
            }
          `,
        }),
      })

      const resultado = await respuesta.json()

      if (resultado.errors) {
        throw new Error('No se pudieron cargar las recetas')
      }

      setRecetas(resultado.data.recetas)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al cargar las recetas',
      )
    } finally {
      setCargando(false)
    }
  }

  function limpiarFormulario() {
    setPacienteId('')
    setMedicamentoId('')
    setDosis('')
    setFrecuencia('')
    setDuracion('')
    setIndicaciones('')
    setFecha('')
    setEditandoId(null)
  }

  function abrirNuevaReceta() {
    limpiarFormulario()
    setMostrarFormulario(true)
    setRecetaSeleccionada(null)
  }

  function editarReceta(receta: Receta) {
    setPacienteId(receta.pacienteId)
    setMedicamentoId(receta.medicamentoId)
    setDosis(receta.dosis)
    setFrecuencia(receta.frecuencia)
    setDuracion(receta.duracion)
    setIndicaciones(receta.indicaciones ?? '')
    setFecha(receta.fecha)
    setEditandoId(receta.id)
    setMostrarFormulario(true)
    setRecetaSeleccionada(null)
  }

  function verReceta(receta: Receta) {
    setRecetaSeleccionada(receta)
    setMostrarFormulario(false)
  }

  async function guardarReceta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setError('')

      const query = editandoId
        ? `
          mutation ActualizarReceta($input: UpdateRecetaInput!) {
            actualizarReceta(input: $input) {
              id
              pacienteId
              medicamentoId
              dosis
              frecuencia
              duracion
              indicaciones
              fecha
            }
          }
        `
        : `
          mutation CrearReceta($input: CreateRecetaInput!) {
            crearReceta(input: $input) {
              id
              pacienteId
              medicamentoId
              dosis
              frecuencia
              duracion
              indicaciones
              fecha
            }
          }
        `

      const input = {
        ...(editandoId ? { id: editandoId } : {}),
        pacienteId,
        medicamentoId,
        dosis,
        frecuencia,
        duracion,
        indicaciones: indicaciones || undefined,
        fecha,
      }

      const respuesta = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            input,
          },
        }),
      })

      const resultado = await respuesta.json()

      if (resultado.errors) {
        throw new Error(
          editandoId
            ? 'No se pudo actualizar la receta'
            : 'No se pudo crear la receta',
        )
      }

      const recetaGuardada = editandoId
        ? resultado.data.actualizarReceta
        : resultado.data.crearReceta

      if (editandoId) {
        setRecetas((recetasActuales) =>
          recetasActuales.map((receta) =>
            receta.id === editandoId ? recetaGuardada : receta,
          ),
        )
      } else {
        setRecetas((recetasActuales) => [
          ...recetasActuales,
          recetaGuardada,
        ])
      }

      limpiarFormulario()
      setMostrarFormulario(false)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al guardar la receta',
      )
    }
  }

  async function eliminarReceta(id: string) {
    const confirmar = window.confirm(
      '¿Estás segura de que querés eliminar esta receta?',
    )

    if (!confirmar) {
      return
    }

    try {
      setError('')

      const respuesta = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            mutation EliminarReceta($id: ID!) {
              eliminarReceta(id: $id)
            }
          `,
          variables: {
            id,
          },
        }),
      })

      const resultado = await respuesta.json()

      if (resultado.errors) {
        throw new Error('No se pudo eliminar la receta')
      }

      setRecetas((recetasActuales) =>
        recetasActuales.filter((receta) => receta.id !== id),
      )

      if (recetaSeleccionada?.id === id) {
        setRecetaSeleccionada(null)
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error al eliminar la receta',
      )
    }
  }

  function cancelarFormulario() {
    limpiarFormulario()
    setMostrarFormulario(false)
  }

  return (
    <main className="recetas-page">
      <header className="recetas-header">
        <div>
          <h1>Recetas</h1>
          <p>Listado de recetas médicas</p>
        </div>

        <button
          type="button"
          className="nueva-receta"
          onClick={abrirNuevaReceta}
        >
          + Nueva receta
        </button>
      </header>

      {mostrarFormulario && (
        <section className="formulario-receta">
          <div className="formulario-header">
            <div>
              <h2>
                {editandoId ? 'Editar receta' : 'Nueva receta'}
              </h2>
              <p>Completá los datos de la receta médica.</p>
            </div>

            <button
              type="button"
              className="cerrar-formulario"
              onClick={cancelarFormulario}
            >
              ×
            </button>
          </div>

          <form onSubmit={guardarReceta}>
            <div className="formulario-grid">
              <label>
                Paciente
                <input
                  value={pacienteId}
                  onChange={(event) => setPacienteId(event.target.value)}
                  placeholder="Ej. 12345678"
                  required
                />
              </label>

              <label>
                Medicamento
                <input
                  value={medicamentoId}
                  onChange={(event) => setMedicamentoId(event.target.value)}
                  placeholder="ID del medicamento"
                  required
                />
              </label>

              <label>
                Dosis
                <input
                  value={dosis}
                  onChange={(event) => setDosis(event.target.value)}
                  placeholder="Ej. 500 mg"
                  required
                />
              </label>

              <label>
                Frecuencia
                <input
                  value={frecuencia}
                  onChange={(event) => setFrecuencia(event.target.value)}
                  placeholder="Ej. Cada 8 horas"
                  required
                />
              </label>

              <label>
                Duración
                <input
                  value={duracion}
                  onChange={(event) => setDuracion(event.target.value)}
                  placeholder="Ej. 5 días"
                  required
                />
              </label>

              <label>
                Fecha
                <input
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  required
                />
              </label>

              <label className="campo-completo">
                Indicaciones
                <textarea
                  value={indicaciones}
                  onChange={(event) => setIndicaciones(event.target.value)}
                  placeholder="Ej. Tomar después de comer"
                  rows={4}
                />
              </label>
            </div>

            <div className="formulario-acciones">
              <button
                type="button"
                className="cancelar"
                onClick={cancelarFormulario}
              >
                Cancelar
              </button>

              <button type="submit" className="guardar">
                {editandoId ? 'Guardar cambios' : 'Guardar receta'}
              </button>
            </div>
          </form>
        </section>
      )}

      {recetaSeleccionada && (
        <section className="receta-card">
          <div className="receta-card-header">
            <div>
              <h2>Detalle de receta</h2>
              <span>
                Paciente: {recetaSeleccionada.pacienteId}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setRecetaSeleccionada(null)}
            >
              ×
            </button>
          </div>

          <div className="receta-datos">
            <div>
              <strong>Fecha</strong>
              <span>{recetaSeleccionada.fecha}</span>
            </div>

            <div>
              <strong>Dosis</strong>
              <span>{recetaSeleccionada.dosis}</span>
            </div>

            <div>
              <strong>Frecuencia</strong>
              <span>{recetaSeleccionada.frecuencia}</span>
            </div>

            <div>
              <strong>Duración</strong>
              <span>{recetaSeleccionada.duracion}</span>
            </div>

            <div>
              <strong>Medicamento</strong>
              <span>{recetaSeleccionada.medicamentoId}</span>
            </div>
          </div>

          {recetaSeleccionada.indicaciones && (
            <div className="indicaciones">
              <strong>Indicaciones</strong>
              <p>{recetaSeleccionada.indicaciones}</p>
            </div>
          )}
        </section>
      )}

      {cargando && <p>Cargando recetas...</p>}

      {error && <div className="error">{error}</div>}

      {!cargando && !error && recetas.length === 0 && (
        <div className="sin-recetas">
          <h2>No hay recetas</h2>
          <p>Todavía no hay recetas registradas.</p>
        </div>
      )}

      {!cargando && !error && recetas.length > 0 && (
        <section className="recetas-lista">
          {recetas.map((receta) => (
            <article className="receta-card" key={receta.id}>
              <div className="receta-card-header">
                <div>
                  <h2>Receta médica</h2>
                  <span>Paciente: {receta.pacienteId}</span>
                </div>

                <span className="receta-fecha">
                  {receta.fecha}
                </span>
              </div>

              <div className="receta-datos">
                <div>
                  <strong>Dosis</strong>
                  <span>{receta.dosis}</span>
                </div>

                <div>
                  <strong>Frecuencia</strong>
                  <span>{receta.frecuencia}</span>
                </div>

                <div>
                  <strong>Duración</strong>
                  <span>{receta.duracion}</span>
                </div>

                <div>
                  <strong>Medicamento</strong>
                  <span>{receta.medicamentoId}</span>
                </div>
              </div>

              {receta.indicaciones && (
                <div className="indicaciones">
                  <strong>Indicaciones</strong>
                  <p>{receta.indicaciones}</p>
                </div>
              )}

              <div className="receta-acciones">
                <button
                  type="button"
                  onClick={() => verReceta(receta)}
                >
                  Ver
                </button>

                <button
                  type="button"
                  onClick={() => editarReceta(receta)}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="eliminar"
                  onClick={() => eliminarReceta(receta.id)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default RecetasPage
