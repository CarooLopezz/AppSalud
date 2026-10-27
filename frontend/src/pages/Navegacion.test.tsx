import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { TOKEN_KEY } from '../api/clients.ts'

// Las pantallas internas llaman a la API: la simulamos para que no se cuelguen
vi.mock('../api/clients.ts', () => ({
  TOKEN_KEY: 'appsalud_token',
  usersApi: { get: vi.fn().mockResolvedValue({ data: [] }), post: vi.fn() },
}))

function abrir(ruta: string) {
  window.history.replaceState({}, '', ruta)
  render(<App />)
}

describe('inicio y navegación', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('el inicio muestra la bienvenida y las tarjetas de acceso', () => {
    abrir('/')

    expect(screen.getByRole('heading', { name: 'Tu salud, en un solo lugar' })).toBeInTheDocument()
    for (const titulo of ['Agenda de médicos', 'Médicos', 'Estudios', 'Recetas', 'Mi perfil']) {
      expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument()
    }
  })

  it('la barra siempre tiene el enlace a Inicio y a las secciones', () => {
    abrir('/')
    const barra = screen.getByRole('navigation', { name: 'Secciones' })

    for (const label of ['Inicio', 'Médicos', 'Estudios', 'Recetas', 'Mi perfil']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(barra).toBeInTheDocument()
  })

  it('una dirección que no existe muestra "Página no encontrada"', () => {
    abrir('/ruta-que-no-existe')

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })

  it('sin sesión, entrar a una sección protegida lleva al login', () => {
    abrir('/estudios')

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('con sesión, una sección protegida se abre (no redirige al login)', () => {
    localStorage.setItem(TOKEN_KEY, 'token-prueba')
    abrir('/estudios')

    // La pantalla de Estudios todavía es provisoria ("en construcción")
    expect(screen.getByRole('heading', { name: 'Estudios' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
  })

  it('desde una tarjeta del inicio se navega a esa sección', () => {
    localStorage.setItem(TOKEN_KEY, 'token-prueba')
    abrir('/')

    fireEvent.click(screen.getByRole('link', { name: /Médicos Consultá/ }))

    expect(screen.getByRole('heading', { name: 'Médicos' })).toBeInTheDocument()
  })
})
