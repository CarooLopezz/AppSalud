import { useState } from 'react'

export const TEMA_KEY = 'appsalud_tema'

type Tema = 'claro' | 'oscuro'

// Lo que se ve ahora: la elección guardada (index.html la aplica al cargar) o, si no hay, la del sistema
function temaActual(): Tema {
  const elegido = document.documentElement.dataset.tema
  if (elegido === 'claro' || elegido === 'oscuro') return elegido
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
}

export default function BotonTema() {
  const [tema, setTema] = useState<Tema>(temaActual)
  const otro: Tema = tema === 'oscuro' ? 'claro' : 'oscuro'

  function cambiar() {
    document.documentElement.dataset.tema = otro
    try {
      localStorage.setItem(TEMA_KEY, otro)
    } catch {
      // Sin almacenamiento (modo privado) el cambio vale hasta recargar
    }
    setTema(otro)
  }

  return (
    <button
      type="button"
      className="boton-tema"
      onClick={cambiar}
      aria-label={`Cambiar a modo ${otro}`}
      title={`Cambiar a modo ${otro}`}
    >
      <span aria-hidden="true">{tema === 'oscuro' ? '☀️' : '🌙'}</span>
    </button>
  )
}
