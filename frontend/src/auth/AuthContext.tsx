import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { TOKEN_KEY } from '../api/clients.ts'
import { AuthContext, SESION_VENCIDA, type AuthContextValue } from './context.ts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [sesionVencida, setSesionVencida] = useState(false)

  // Si el servidor rechaza el token, se cierra la sesión y las rutas protegidas mandan al login
  useEffect(() => {
    function alVencer() {
      setToken(null)
      setSesionVencida(true)
    }
    window.addEventListener(SESION_VENCIDA, alVencer)
    return () => window.removeEventListener(SESION_VENCIDA, alVencer)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    token,
    sesionVencida,
    iniciarSesion: (nuevoToken) => {
      localStorage.setItem(TOKEN_KEY, nuevoToken)
      setToken(nuevoToken)
      setSesionVencida(false)
    },
    cerrarSesion: () => {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      setSesionVencida(false)
    },
  }), [token, sesionVencida])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
