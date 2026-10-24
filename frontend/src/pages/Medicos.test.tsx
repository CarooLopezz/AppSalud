import { fireEvent, render, screen } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Medicos from './Medicos.tsx'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('../api/clients.ts', () => ({
  usersApi: { get },
}))

const medicos = [
  { _id: '1', nombre: 'Bruno Díaz', email: 'bruno@appsalud.com' },
  { _id: '2', nombre: 'Laura Méndez', email: 'laura@appsalud.com' },
]

function errorDeApi(status: number, message: string) {
  return new AxiosError('error', String(status), undefined, undefined, {
    status,
    data: { message },
  } as AxiosResponse)
}

describe('pantalla de Médicos', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('muestra "Cargando" y después la lista de médicos con su email', async () => {
    get.mockResolvedValue({ data: medicos })

    render(<Medicos />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando médicos')
    expect(await screen.findByRole('heading', { name: 'Bruno Díaz' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Laura Méndez' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'laura@appsalud.com' })).toHaveAttribute(
      'href',
      'mailto:laura@appsalud.com',
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/users/medicos')
  })

  it('el buscador filtra por nombre o email, sin importar mayúsculas', async () => {
    get.mockResolvedValue({ data: medicos })
    render(<Medicos />)
    await screen.findByRole('heading', { name: 'Bruno Díaz' })
    const buscador = screen.getByRole('searchbox', { name: 'Buscar médico' })

    fireEvent.change(buscador, { target: { value: 'LAURA' } })
    expect(screen.getByRole('heading', { name: 'Laura Méndez' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Bruno Díaz' })).not.toBeInTheDocument()

    fireEvent.change(buscador, { target: { value: 'bruno@' } })
    expect(screen.getByRole('heading', { name: 'Bruno Díaz' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Laura Méndez' })).not.toBeInTheDocument()
  })

  it('si la búsqueda no coincide con nadie muestra "No hay resultados"', async () => {
    get.mockResolvedValue({ data: medicos })
    render(<Medicos />)
    await screen.findByRole('heading', { name: 'Bruno Díaz' })

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar médico' }), {
      target: { value: 'pediatra que no existe' },
    })

    expect(screen.getByRole('heading', { name: 'No hay resultados' })).toBeInTheDocument()
  })

  it('si no hay médicos registrados lo avisa', async () => {
    get.mockResolvedValue({ data: [] })

    render(<Medicos />)

    expect(
      await screen.findByRole('heading', { name: 'Todavía no hay médicos registrados' }),
    ).toBeInTheDocument()
  })

  it('si la API falla muestra el mensaje del servidor', async () => {
    get.mockRejectedValue(errorDeApi(401, 'Token inválido o vencido'))

    render(<Medicos />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Token inválido o vencido')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('si falla sin mensaje (por ejemplo, sin conexión) muestra un mensaje genérico', async () => {
    get.mockRejectedValue(new Error('Network Error'))

    render(<Medicos />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar el listado de médicos.',
    )
  })
})
