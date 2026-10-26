import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Agenda from './Agenda.tsx'

const { get, post, patch, remove } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('../api/clients.ts', () => ({
  usersApi: { get, post, patch, delete: remove },
}))

const medico = {
  _id: 'doctor-1',
  nombre: 'Dra. Ana',
  email: 'ana@example.com',
}

describe('Agenda', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    patch.mockReset()
    remove.mockReset()
    get.mockImplementation((path: string) => {
      if (path === '/users/me') {
        return Promise.resolve({
          data: { _id: 'patient-1', nombre: 'Paciente', email: 'p@example.com', rol: 'paciente' },
        })
      }
      if (path === '/appointments') return Promise.resolve({ data: [] })
      if (path === '/users/medicos') return Promise.resolve({ data: [medico] })
      return Promise.reject(new Error(`Ruta inesperada: ${path}`))
    })
  })

  it('permite solicitar un turno y lo envía con la fecha en formato ISO', async () => {
    post.mockResolvedValue({ data: { _id: 'appointment-1' } })
    const fecha = new Date(Date.now() + 86_400_000)
    const fechaLocal = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16)

    render(<Agenda />)

    fireEvent.change(await screen.findByLabelText('Médico'), {
      target: { value: medico._id },
    })
    fireEvent.change(screen.getByLabelText('Fecha y hora'), {
      target: { value: fechaLocal },
    })
    fireEvent.change(screen.getByLabelText('Motivo de consulta'), {
      target: { value: 'Control anual' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Solicitar turno' }))

    await waitFor(() => expect(post).toHaveBeenCalledOnce())
    expect(post).toHaveBeenCalledWith('/appointments', {
      medicoId: medico._id,
      fecha: new Date(fechaLocal).toISOString(),
      motivo: 'Control anual',
    })
  })

  it('muestra la agenda vacía y el formulario de solicitud al paciente', async () => {
    render(<Agenda />)

    expect(await screen.findByRole('heading', { name: 'Solicitar un turno' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'No hay turnos en la agenda' })).toBeInTheDocument()
  })

  it('permite al médico confirmar un turno asignado', async () => {
    get.mockImplementation((path: string) => {
      if (path === '/users/me') {
        return Promise.resolve({
          data: { _id: medico._id, nombre: medico.nombre, email: medico.email, rol: 'medico' },
        })
      }
      if (path === '/appointments') {
        return Promise.resolve({
          data: [{
            _id: 'appointment-1',
            medicoId: medico,
            pacienteId: { _id: 'patient-1', nombre: 'Paciente Uno', email: 'p@example.com' },
            fecha: new Date(Date.now() + 86_400_000).toISOString(),
            motivo: 'Control',
            estado: 'pendiente',
          }],
        })
      }
      return Promise.reject(new Error(`Ruta inesperada: ${path}`))
    })
    patch.mockResolvedValue({ data: {} })

    render(<Agenda />)
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }))

    await waitFor(() => {
      expect(patch).toHaveBeenCalledWith('/appointments/appointment-1/estado', {
        estado: 'confirmado',
      })
    })
  })
})
