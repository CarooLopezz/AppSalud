import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'
import { TOKEN_KEY } from './api/clients.ts'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('./api/clients.ts', () => ({
  TOKEN_KEY: 'appsalud_token',
  usersApi: { post },
}))

describe('flujo de cuenta', () => {
  beforeEach(() => {
    localStorage.clear()
    post.mockReset()
    window.history.replaceState({}, '', '/')
  })

  it('registra una cuenta e inicia sesión con el token recibido', async () => {
    post
      .mockResolvedValueOnce({ data: { id: 'user-1' } })
      .mockResolvedValueOnce({ data: { access_token: 'token-prueba' } })

    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: 'Crear cuenta' }))
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Salud' } })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@example.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Cuenta creada')
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('ana@example.com')
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'clave123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBe('token-prueba'))
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeTruthy()
    expect(post).toHaveBeenNthCalledWith(1, '/auth/register', {
      nombre: 'Ana Salud',
      email: 'ana@example.com',
      password: 'clave123',
    })
    expect(post).toHaveBeenNthCalledWith(2, '/auth/login', {
      email: 'ana@example.com',
      password: 'clave123',
    })
  })

  it('redirige a iniciar sesión al abrir una sección protegida sin token', async () => {
    window.history.replaceState({}, '', '/medicos')

    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
    expect(post).not.toHaveBeenCalled()
  })
})
