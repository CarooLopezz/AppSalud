import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { recetasApi, usersApi } from '../api/clients.ts'
import { errorMessage } from '../api/errorMessage.ts'

type Medicamento = {
  id: string
  nombre: string
  presentacion?: string
}

type Receta = {
  id: string
  pacienteId: string
  medicamentoId: string
  dosis: string
  frecuencia: string
  duracion: string
  indicaciones?: string
  fecha: string
  medicamento?: Medicamento
}

const CAMPOS_RECETA = `
  id
  pacienteId
  medicamentoId
  dosis
  frecuencia
  duracion
  indicaciones
  fecha
  medicamento { id nombre presentacion }
`

// recetas-service es GraphQL: todo va por POST /graphql, con el token de la sesión
async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const { data } = await recetasApi.post<{ data?: T; errors?: { message: string }[] }>('/graphql', {
    query,
    variables,
  })
  if (data.errors?.length || !data.data) throw new Error(data.errors?.[0]?.message ?? 'Error de GraphQL')
  return data.data
}

// '2026-06-25' → '25/06/2026'
function formatearFecha(fecha: string) {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : fecha
}

function RecetasPage() {
  const [pacienteId, setPacienteId] = useState('')
  const [recetas, setRecetas] = useState<Receta[]>([])
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [recetaSeleccionada, setRecetaSeleccionada] =
    useState<Receta | null>(null)

  const [medicamentoId, setMedicamentoId] = useState('')
  const [dosis, setDosis] = useState('')
  const [frecuencia, setFrecuencia] = useState('')
  const [duracion, setDuracion] = useState('')
  const [indicaciones, setIndicaciones] = useState('')
  const [fecha, setFecha] = useState('')

  useEffect(() => {
    let activo = true

    async function cargar() {
      try {
        const [{ data: cuenta }, datos] = await Promise.all([
          usersApi.get<{ _id: string }>('/users/me'),
          graphql<{ recetas: Receta[]; medicamentos: Medicamento[] }>(`
            {
              recetas { ${CAMPOS_RECETA} }
              medicamentos { id nombre presentacion }
            }
          `),
        ])
        if (!activo) return
        setPacienteId(cuenta._id)
        // El servicio devuelve todas las recetas: acá se muestran solo las del usuario
        setRecetas(datos.recetas.filter((receta) => receta.pacienteId === cuenta._id))
        setMedicamentos(datos.medicamentos)
      } catch (requestError) {
        if (activo) setError(errorMessage(requestError, 'No se pudieron cargar las recetas.'))
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargar()
    return () => { activo = false }
  }, [])

  function limpiarFormulario() {
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
    setMedicamentoId(receta.medicamentoId)
    setDosis(receta.dosis)
    setFrecuencia(receta.frecuencia)
    setDuracion(receta.duracion)
    setIndicaciones(receta.indicaciones ?? '')
    setFecha(receta.fecha.slice(0, 10))
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

      let recetaGuardada: Receta
      if (editandoId) {
        const datos = await graphql<{ actualizarReceta: Receta }>(
          `mutation ActualizarReceta($input: UpdateRecetaInput!) {
            actualizarReceta(input: $input) { ${CAMPOS_RECETA} }
          }`,
          { input },
        )
        recetaGuardada = datos.actualizarReceta
        setRecetas((recetasActuales) =>
          recetasActuales.map((receta) =>
            receta.id === editandoId ? recetaGuardada : receta,
          ),
        )
      } else {
        const datos = await graphql<{ crearReceta: Receta }>(
          `mutation CrearReceta($input: CreateRecetaInput!) {
            crearReceta(input: $input) { ${CAMPOS_RECETA} }
          }`,
          { input },
        )
        recetaGuardada = datos.crearReceta
        setRecetas((recetasActuales) => [...recetasActuales, recetaGuardada])
      }

      limpiarFormulario()
      setMostrarFormulario(false)
    } catch (requestError) {
      setError(
        errorMessage(
          requestError,
          editandoId ? 'No se pudo actualizar la receta.' : 'No se pudo crear la receta.',
        ),
      )
    }
  }

  async function eliminarReceta(id: string) {
    if (!window.confirm('¿Querés eliminar esta receta?')) return

    try {
      setError('')
      await graphql<{ eliminarReceta: boolean }>(
        `mutation EliminarReceta($id: ID!) {
          eliminarReceta(id: $id)
        }`,
        { id },
      )

      setRecetas((recetasActuales) =>
        recetasActuales.filter((receta) => receta.id !== id),
      )

      if (recetaSeleccionada?.id === id) {
        setRecetaSeleccionada(null)
      }
    } catch (requestError) {
      setError(errorMessage(requestError, 'No se pudo eliminar la receta.'))
    }
  }

  function cancelarFormulario() {
    limpiarFormulario()
    setMostrarFormulario(false)
  }

  function nombreMedicamento(receta: Receta) {
    const medicamento = receta.medicamento
      ?? medicamentos.find((m) => m.id === receta.medicamentoId)
    if (!medicamento) return 'Medicamento no encontrado'
    return medicamento.presentacion
      ? `${medicamento.nombre} (${medicamento.presentacion})`
      : medicamento.nombre
  }

  return (
    <section className="recetas-page">
      <div className="encabezado-pagina">
        <div>
          <p className="sobrelinea">TRATAMIENTOS</p>
          <h1>Mis recetas</h1>
          <p className="texto-suave">Tus recetas médicas con su medicamento, dosis y duración.</p>
        </div>

        {!cargando && pacienteId && (
          <button
            type="button"
            className="boton boton-primario"
            onClick={abrirNuevaReceta}
          >
            + Nueva receta
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <section className="formulario-receta" aria-labelledby="formulario-receta-titulo">
          <div className="receta-card-header">
            <div>
              <h2 id="formulario-receta-titulo">
                {editandoId ? 'Editar receta' : 'Nueva receta'}
              </h2>
              <p className="texto-suave">Completá los datos de la receta médica.</p>
            </div>

            <button
              type="button"
              className="cerrar"
              aria-label="Cerrar formulario"
              onClick={cancelarFormulario}
            >
              ×
            </button>
          </div>

          <form onSubmit={guardarReceta}>
            <div className="formulario-grid">
              <label>
                Medicamento
                <select
                  value={medicamentoId}
                  onChange={(event) => setMedicamentoId(event.target.value)}
                  required
                >
                  <option value="">Elegí un medicamento</option>
                  {medicamentos.map((medicamento) => (
                    <option key={medicamento.id} value={medicamento.id}>
                      {medicamento.presentacion
                        ? `${medicamento.nombre} (${medicamento.presentacion})`
                        : medicamento.nombre}
                    </option>
                  ))}
                </select>
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

            <div className="receta-acciones">
              <button
                type="button"
                className="boton"
                onClick={cancelarFormulario}
              >
                Cancelar
              </button>

              <button type="submit" className="boton boton-primario">
                {editandoId ? 'Guardar cambios' : 'Guardar receta'}
              </button>
            </div>
          </form>
        </section>
      )}

      {recetaSeleccionada && (
        <section className="receta-card receta-detalle" aria-labelledby="detalle-receta-titulo">
          <div className="receta-card-header">
            <div>
              <h2 id="detalle-receta-titulo">{nombreMedicamento(recetaSeleccionada)}</h2>
              <span className="texto-suave">Detalle de la receta</span>
            </div>

            <button
              type="button"
              className="cerrar"
              aria-label="Cerrar detalle"
              onClick={() => setRecetaSeleccionada(null)}
            >
              ×
            </button>
          </div>

          <dl className="receta-datos">
            <div>
              <dt>Fecha</dt>
              <dd>{formatearFecha(recetaSeleccionada.fecha)}</dd>
            </div>

            <div>
              <dt>Dosis</dt>
              <dd>{recetaSeleccionada.dosis}</dd>
            </div>

            <div>
              <dt>Frecuencia</dt>
              <dd>{recetaSeleccionada.frecuencia}</dd>
            </div>

            <div>
              <dt>Duración</dt>
              <dd>{recetaSeleccionada.duracion}</dd>
            </div>
          </dl>

          {recetaSeleccionada.indicaciones && (
            <div className="indicaciones">
              <strong>Indicaciones</strong>
              <p>{recetaSeleccionada.indicaciones}</p>
            </div>
          )}
        </section>
      )}

      {cargando && <p role="status">Cargando recetas…</p>}

      {error && <p className="mensaje-error" role="alert">{error}</p>}

      {!cargando && !error && recetas.length === 0 && (
        <div className="estado-vacio">
          <h2>Todavía no tenés recetas</h2>
          <p>Cuando cargues una receta, va a aparecer en este listado.</p>
        </div>
      )}

      {!cargando && recetas.length > 0 && (
        <ul className="recetas-lista">
          {recetas.map((receta) => (
            <li className="receta-card" key={receta.id}>
              <div className="receta-card-header">
                <h2>{nombreMedicamento(receta)}</h2>

                <span className="receta-fecha">
                  {formatearFecha(receta.fecha)}
                </span>
              </div>

              <dl className="receta-datos">
                <div>
                  <dt>Dosis</dt>
                  <dd>{receta.dosis}</dd>
                </div>

                <div>
                  <dt>Frecuencia</dt>
                  <dd>{receta.frecuencia}</dd>
                </div>

                <div>
                  <dt>Duración</dt>
                  <dd>{receta.duracion}</dd>
                </div>
              </dl>

              <div className="receta-acciones">
                <button
                  type="button"
                  className="boton"
                  onClick={() => verReceta(receta)}
                >
                  Ver
                </button>

                <button
                  type="button"
                  className="boton"
                  onClick={() => editarReceta(receta)}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="boton boton-peligro"
                  onClick={() => eliminarReceta(receta.id)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default RecetasPage
