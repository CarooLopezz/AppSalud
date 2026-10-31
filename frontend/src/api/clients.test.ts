import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SESION_VENCIDA } from '../auth/context.ts'
import { TOKEN_KEY, usersApi } from './clients.ts'

// Reemplaza la red: cada pedido termina con el status indicado
function responderCon(status: number) {
  usersApi.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    throw new AxiosError('error', String(status), config, undefined, {
      status,
      statusText: '',
      headers: {},
      config,
      data: { message: 'error' },
    } as AxiosResponse)
  }
}

describe('cliente de la API', () => {
  const alVencer = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    alVencer.mockReset()
    window.addEventListener(SESION_VENCIDA, alVencer)
  })

  afterEach(() => {
    window.removeEventListener(SESION_VENCIDA, alVencer)
  })

  it('un 401 con token borra la sesión y avisa que venció', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-vencido')
    responderCon(401)

    await expect(usersApi.get('/users/me')).rejects.toThrow()

    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(alVencer).toHaveBeenCalledTimes(1)
  })

  it('un 401 sin token (contraseña incorrecta) no avisa nada', async () => {
    responderCon(401)

    await expect(usersApi.post('/auth/login', {})).rejects.toThrow()

    expect(alVencer).not.toHaveBeenCalled()
  })

  it('otros errores no cierran la sesión', async () => {
    localStorage.setItem(TOKEN_KEY, 'token-valido')
    responderCon(500)

    await expect(usersApi.get('/users/me')).rejects.toThrow()

    expect(localStorage.getItem(TOKEN_KEY)).toBe('token-valido')
    expect(alVencer).not.toHaveBeenCalled()
  })
})
