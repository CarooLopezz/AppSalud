import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import BotonTema, { TEMA_KEY } from './BotonTema.tsx'

describe('botón de modo claro/oscuro', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.tema
  })

  it('cambia de modo y recuerda la elección', () => {
    document.documentElement.dataset.tema = 'claro'
    render(<BotonTema />)

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }))

    expect(document.documentElement.dataset.tema).toBe('oscuro')
    expect(localStorage.getItem(TEMA_KEY)).toBe('oscuro')
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument()
  })

  it('vuelve a modo claro desde oscuro', () => {
    document.documentElement.dataset.tema = 'oscuro'
    render(<BotonTema />)

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }))

    expect(document.documentElement.dataset.tema).toBe('claro')
    expect(localStorage.getItem(TEMA_KEY)).toBe('claro')
  })
})
