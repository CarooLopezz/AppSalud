import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { TOKEN_KEY } from '../api/clients.ts'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('../api/clients.ts', () => ({
  TOKEN_KEY: 'appsalud_token',
  usersApi: { post },
}))

function errorDeApi(status: number, message: string | string[]) {
  return new AxiosError('error', String(status), undefined, undefined, {
    status,
    data: { message },
  } as AxiosResponse)
}

function abrir(ruta: string) {
  window.history.replaceState({}, '', ruta)
  render(<App />)
}

function completarLogin(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
}

// Casos de error del login y el registro (el camino feliz está en App.test.tsx)
describe('iniciar sesión', () => {
  beforeEach(() => {
    localStorage.clear()
    post.mockReset()
  })

  it('con datos incorrectos muestra el mensaje del servidor y no guarda token', async () => {
    post.mockRejectedValue(errorDeApi(401, 'Credenciales inválidas'))
    abrir('/login')

    completarLogin('ana@appsalud.com', 'claveMala')

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('sin conexión con el servidor muestra un mensaje genérico', async () => {
    post.mockRejectedValue(new Error('Network Error'))
    abrir('/login')

    completarLogin('ana@appsalud.com', 'Secreta123')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo iniciar sesión. Intenta nuevamente.',
    )
  })

  it('mientras espera la respuesta deshabilita el botón para no mandar dos veces', async () => {
    let responder: (valor: unknown) => void = () => {}
    post.mockReturnValue(new Promise((r) => (responder = r)))
    abrir('/login')

    completarLogin('ana@appsalud.com', 'Secreta123')

    expect(await screen.findByRole('button', { name: 'Ingresando…' })).toBeDisabled()
    responder({ data: { access_token: 'token-prueba' } })
    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBe('token-prueba'))
  })

  it('después de iniciar sesión vuelve a la sección protegida que se quería ver', async () => {
    post.mockResolvedValue({ data: { access_token: 'token-prueba' } })
    abrir('/recetas')
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()

    completarLogin('ana@appsalud.com', 'Secreta123')

    expect(await screen.findByRole('heading', { name: 'Recetas' })).toBeInTheDocument()
  })

  it('cerrar sesión borra el token y vuelve a mostrar "Iniciar sesión"', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-prueba')
    abrir('/')

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(screen.getAllByRole('link', { name: 'Iniciar sesión' }).length).toBeGreaterThan(0)
  })
})

describe('registro', () => {
  beforeEach(() => {
    localStorage.clear()
    post.mockReset()
  })

  function completarRegistro() {
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Salud' } })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'ana@appsalud.com' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Secreta123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  }

  it('con un email ya registrado muestra el aviso y se queda en el registro', async () => {
    post.mockRejectedValue(errorDeApi(409, 'El email ya está registrado'))
    abrir('/registro')

    completarRegistro()

    expect(await screen.findByRole('alert')).toHaveTextContent('El email ya está registrado')
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
  })

  it('si el servidor rechaza varios datos muestra todos los motivos', async () => {
    post.mockRejectedValue(
      errorDeApi(400, ['email must be an email', 'password must be longer than or equal to 6 characters']),
    )
    abrir('/registro')

    completarRegistro()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'email must be an email. password must be longer than or equal to 6 characters',
    )
  })

  it('el campo de contraseña pide al menos 6 caracteres', () => {
    abrir('/registro')

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('minLength', '6')
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password')
  })
})
