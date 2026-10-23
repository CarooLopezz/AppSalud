import { createContext } from 'react'

export interface AuthContextValue {
  token: string | null
  iniciarSesion: (token: string) => void
  cerrarSesion: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
