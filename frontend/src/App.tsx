import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Inicio from './pages/Inicio.tsx'
import EnConstruccion from './pages/EnConstruccion.tsx'
import NoEncontrada from './pages/NoEncontrada.tsx'

// Cada módulo reemplaza su <EnConstruccion /> por su página real
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="estudios" element={<EnConstruccion titulo="Estudios" />} />
          <Route path="recetas" element={<EnConstruccion titulo="Recetas" />} />
          <Route path="perfil" element={<EnConstruccion titulo="Mi perfil" />} />
          <Route path="login" element={<EnConstruccion titulo="Iniciar sesión" />} />
          <Route path="registro" element={<EnConstruccion titulo="Crear cuenta" />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
