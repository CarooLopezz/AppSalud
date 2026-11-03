import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Agenda from './Agenda.tsx'

const { get, post, patch, remove, listarProximosControles } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  listarProximosControles: vi.fn(),
}))

vi.mock('../api/clients.ts', () => ({
  usersApi: { get, post, patch, delete: remove },
}))

vi.mock('../api/estudios.ts', () => ({
  listarProximosControles,
  formatearFecha: (fecha: string) => fecha,
}))

const manana = new Date(Date.now() + 86_400_000).toISOString()
const ayer = new Date(Date.now() - 86_400_000).toISOString()

describe('Agenda', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
    remove.mockReset()
    listarProximosControles.mockReset()
    listarProximosControles.mockResolvedValue([])
    get.mockResolvedValue({ data: [] })
  })

  it('permite anotar un turno y lo envía con la fecha en formato ISO', async () => {
    post.mockResolvedValue({ data: { _id: 'turno-1' } })
    const fechaLocal = '2026-11-15T10:00'

    render(<Agenda />)

    fireEvent.change(screen.getByLabelText('Profesional'), {
      target: { value: 'Dra. Paula Ríos' },
    })
    fireEvent.change(screen.getByLabelText('Especialidad'), {
      target: { value: 'Cardiología' },
    })
    fireEvent.change(screen.getByLabelText('Fecha y hora'), {
      target: { value: fechaLocal },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar turno' }))

    await waitFor(() => expect(post).toHaveBeenCalledOnce())
    expect(post).toHaveBeenCalledWith('/appointments', {
      profesional: 'Dra. Paula Ríos',
      especialidad: 'Cardiología',
      lugar: '',
      fecha: new Date(fechaLocal).toISOString(),
      motivo: '',
    })
  })

  it('muestra la agenda vacía', async () => {
    render(<Agenda />)

    expect(screen.getByRole('heading', { name: 'Anotar un turno' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'No tenés turnos próximos' })).toBeInTheDocument()
  })

  it('separa los turnos próximos de los pasados', async () => {
    get.mockResolvedValue({
      data: [
        { _id: 'turno-1', profesional: 'Dr. Pasado', fecha: ayer, asistido: false },
        { _id: 'turno-2', profesional: 'Dra. Futura', fecha: manana, asistido: false },
      ],
    })

    render(<Agenda />)

    const proximos = (await screen.findByRole('heading', { name: 'Próximos turnos' })).parentElement!
    const pasados = screen.getByRole('heading', { name: 'Turnos pasados' }).parentElement!
    expect(proximos).toHaveTextContent('Dra. Futura')
    expect(proximos).not.toHaveTextContent('Dr. Pasado')
    expect(pasados).toHaveTextContent('Dr. Pasado')
  })

  it('permite marcar un turno pasado como asistido', async () => {
    get.mockResolvedValue({
      data: [{ _id: 'turno-1', profesional: 'Dr. Sosa', fecha: ayer, asistido: false }],
    })
    patch.mockResolvedValue({ data: {} })

    render(<Agenda />)
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar como asistido' }))

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith('/appointments/turno-1', { asistido: true })
    })
  })

  it('permite eliminar un turno', async () => {
    get.mockResolvedValue({
      data: [{ _id: 'turno-1', profesional: 'Dr. Sosa', fecha: manana, asistido: false }],
    })
    remove.mockResolvedValue({ data: {} })

    render(<Agenda />)
    fireEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(remove).toHaveBeenCalledWith('/appointments/turno-1'))
  })

  it('muestra los próximos controles de los estudios', async () => {
    listarProximosControles.mockResolvedValue([
      { id: 'e-1', tipo: 'Ecografía tiroidea', especialidad: 'Endocrinología', medico: 'Dr. Ríos', fecha: '2026-06-20', proximoControl: '2026-12-20' },
    ])

    render(<Agenda />)

    expect(await screen.findByText('Ecografía tiroidea')).toBeInTheDocument()
  })
})
