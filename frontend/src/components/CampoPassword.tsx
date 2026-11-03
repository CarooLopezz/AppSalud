import { useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

// Campo de contraseña con un botón para mostrarla u ocultarla
export default function CampoPassword(props: Props) {
  const [visible, setVisible] = useState(false)
  const accion = visible ? 'Ocultar contraseña' : 'Mostrar contraseña'

  return (
    <div className="campo-password">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="boton-ver-password"
        onClick={() => setVisible((actual) => !actual)}
        aria-label={accion}
        aria-pressed={visible}
        title={accion}
      >
        <span aria-hidden="true">{visible ? '🙈' : '👁️'}</span>
      </button>
    </div>
  )
}
