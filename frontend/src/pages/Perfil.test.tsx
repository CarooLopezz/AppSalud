import { render, screen } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../auth/AuthContext.tsx'
import Perfil from './Perfil.tsx'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('../api/clients.ts', () => ({
  TOKEN_KEY: 'appsalud_token',
  usersApi: { get },
}))

function errorDeApi(status: number, message: string) {
  return new AxiosError('error', String(status), undefined, undefined, {
    status,
    data: { message },
  } as AxiosResponse)
}

function abrir() {
  render(
    <AuthProvider>
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('pantalla de Mi perfil', () => {
  beforeEach(() => {
    get.mockReset()
  })

  it('muestra "Cargando" y después los datos de la cuenta', async () => {
    get.mockResolvedValue({
      data: { _id: '1', nombre: 'Ana Salud', email: 'ana@appsalud.com', rol: 'paciente' },
    })

    abrir()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando tus datos')
    expect(await screen.findByRole('heading', { name: 'Ana Salud' })).toBeInTheDocument()
    expect(screen.getByText('ana@appsalud.com')).toBeInTheDocument()
    expect(screen.getByText('Paciente')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/users/me')
  })

  it('muestra el error que devuelve la API', async () => {
    get.mockRejectedValue(errorDeApi(401, 'Token inválido o vencido'))

    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent('Token inválido o vencido')
  })
})
