import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TOKEN_KEY } from '../api/clients.ts'
import { AuthContext, type AuthContextValue } from './context.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))

  const value = useMemo<AuthContextValue>(() => ({
    token,
    iniciarSesion: (nuevoToken) => {
      localStorage.setItem(TOKEN_KEY, nuevoToken)
      setToken(nuevoToken)
    },
    cerrarSesion: () => {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
    },
  }), [token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
