import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecetasPage from './RecetasPage.tsx'

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))

vi.mock('../api/clients.ts', () => ({
  usersApi: { get },
  recetasApi: { post },
}))

const ibuprofeno = { id: 'med-1', nombre: 'Ibuprofeno', presentacion: '400 mg' }
const levotiroxina = { id: 'med-2', nombre: 'Levotiroxina' }

const recetaDeAna = {
  id: 'rec-1',
  pacienteId: 'ana',
  medicamentoId: 'med-1',
  dosis: '400 mg',
  frecuencia: 'Cada 8 horas',
  duracion: '5 días',
  fecha: '2026-06-25',
  medicamento: ibuprofeno,
}

const recetaDeOtro = { ...recetaDeAna, id: 'rec-2', pacienteId: 'otro', dosis: '1 g' }

// Responde según la operación de GraphQL que se mande
function responderGraphql(respuestas: Record<string, unknown>) {
  post.mockImplementation((_path: string, { query }: { query: string }) => {
    const operacion = Object.keys(respuestas).find((nombre) => query.includes(nombre))
    return Promise.resolve({ data: { data: operacion ? respuestas[operacion] : {} } })
  })
}

describe('pantalla de Recetas', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    get.mockResolvedValue({ data: { _id: 'ana' } })
  })

  it('muestra solo las recetas del usuario, con el nombre del medicamento y la fecha', async () => {
    responderGraphql({ recetas: { recetas: [recetaDeAna, recetaDeOtro], medicamentos: [ibuprofeno] } })

    render(<RecetasPage />)

    expect(await screen.findByRole('heading', { name: 'Ibuprofeno (400 mg)' })).toBeInTheDocument()
    expect(screen.getByText('25/06/2026')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByText('1 g')).not.toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/graphql', expect.anything())
  })

  it('sin recetas muestra el estado vacío', async () => {
    responderGraphql({ recetas: { recetas: [recetaDeOtro], medicamentos: [] } })

    render(<RecetasPage />)

    expect(await screen.findByRole('heading', { name: 'Todavía no tenés recetas' })).toBeInTheDocument()
  })

  it('crea una receta a nombre del usuario eligiendo el medicamento de la lista', async () => {
    responderGraphql({
      recetas: { recetas: [], medicamentos: [ibuprofeno, levotiroxina] },
      CrearReceta: {
        crearReceta: { ...recetaDeAna, id: 'rec-3', medicamentoId: 'med-2', dosis: '50 mcg', medicamento: levotiroxina },
      },
    })

    render(<RecetasPage />)
    fireEvent.click(await screen.findByRole('button', { name: '+ Nueva receta' }))
    const formulario = screen.getByRole('region', { name: 'Nueva receta' })
    fireEvent.change(within(formulario).getByLabelText('Medicamento'), { target: { value: 'med-2' } })
    fireEvent.change(within(formulario).getByLabelText('Dosis'), { target: { value: '50 mcg' } })
    fireEvent.change(within(formulario).getByLabelText('Frecuencia'), { target: { value: 'Una vez al día' } })
    fireEvent.change(within(formulario).getByLabelText('Duración'), { target: { value: 'Crónico' } })
    fireEvent.change(within(formulario).getByLabelText('Fecha'), { target: { value: '2026-10-01' } })
    fireEvent.click(within(formulario).getByRole('button', { name: 'Guardar receta' }))

    expect(await screen.findByRole('heading', { name: 'Levotiroxina' })).toBeInTheDocument()
    const [, { variables }] = post.mock.calls.at(-1)!
    expect(variables.input).toMatchObject({ pacienteId: 'ana', medicamentoId: 'med-2', dosis: '50 mcg' })
  })

  it('muestra el error si GraphQL responde con errores', async () => {
    post.mockResolvedValue({ data: { errors: [{ message: 'Servicio caído' }] } })

    render(<RecetasPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar las recetas.')
  })
})
