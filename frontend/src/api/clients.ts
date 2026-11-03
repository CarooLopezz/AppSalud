import axios, { type AxiosInstance } from 'axios'
import { SESION_VENCIDA } from '../auth/context.ts'

// Las URLs se pueden cambiar con un .env (ver .env.example).
// Vite las lee al compilar, así que hay que reiniciar `npm run dev` si cambian.
const USERS_URL = import.meta.env.VITE_USERS_URL ?? 'http://localhost:3001'
const ESTUDIOS_URL = import.meta.env.VITE_ESTUDIOS_URL ?? 'http://localhost:3002'
const RECETAS_URL = import.meta.env.VITE_RECETAS_URL ?? 'http://localhost:3003'

export const TOKEN_KEY = 'appsalud_token'

function crearCliente(baseURL: string): AxiosInstance {
  const cliente = axios.create({ baseURL })

  // Si hay sesión iniciada, cada pedido viaja con el JWT
  cliente.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // Un 401 con token significa que la sesión venció: se borra y se avisa a la app.
  // Sin token (por ejemplo, contraseña incorrecta en el login) el error sigue de largo.
  cliente.interceptors.response.use(undefined, (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event(SESION_VENCIDA))
    }
    return Promise.reject(error)
  })

  return cliente
}

export const usersApi = crearCliente(USERS_URL)
export const estudiosApi = crearCliente(ESTUDIOS_URL)
export const recetasApi = crearCliente(RECETAS_URL)
