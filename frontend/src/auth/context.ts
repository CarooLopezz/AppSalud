import { createContext } from 'react'

// Lo emite el cliente de la API cuando el servidor rechaza el token (vencido o inválido)
export const SESION_VENCIDA = 'appsalud:sesion-vencida'

export interface AuthContextValue {
  token: string | null
  sesionVencida: boolean
  iniciarSesion: (token: string) => void
  cerrarSesion: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
