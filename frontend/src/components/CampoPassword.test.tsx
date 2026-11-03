import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CampoPassword from './CampoPassword.tsx'

describe('CampoPassword', () => {
  it('oculta la contraseña y la muestra al tocar el ojito', () => {
    render(
      <>
        <label htmlFor="clave">Contraseña</label>
        <CampoPassword id="clave" defaultValue="demo1234" />
      </>,
    )
    const campo = screen.getByLabelText('Contraseña')
    expect(campo).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(campo).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(campo).toHaveAttribute('type', 'password')
  })
})
