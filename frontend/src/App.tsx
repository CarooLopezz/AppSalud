import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import type { ReactNode } from "react";
import Layout from "./components/Layout.tsx";
import Inicio from "./pages/Inicio.tsx";
import NoEncontrada from "./pages/NoEncontrada.tsx";
import IniciarSesion from "./pages/IniciarSesion.tsx";
import Registro from "./pages/Registro.tsx";
import Medicos from "./pages/Medicos.tsx";
import Agenda from "./pages/Agenda.tsx";
import { AuthProvider } from "./auth/AuthContext.tsx";
import { useAuth } from "./auth/useAuth.ts";
import Estudios from "./pages/Estudios.tsx";
import Perfil from "./pages/Perfil.tsx";
import RecetasPage from "./recetas/RecetasPage.tsx";

function RutaProtegida({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();
  return token ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname }} />
  );
}

function Rutas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route
          path="medicos"
          element={
            <RutaProtegida>
              <Medicos />
            </RutaProtegida>
          }
        />
        <Route
          path="agenda"
          element={
            <RutaProtegida>
              <Agenda />
            </RutaProtegida>
          }
        />
        <Route path="login" element={<IniciarSesion />} />
        <Route path="registro" element={<Registro />} />
        <Route
          path="estudios"
          element={
            <RutaProtegida>
              <Estudios />
            </RutaProtegida>
          }
        />

        <Route
          path="recetas"
          element={
            <RutaProtegida>
              <RecetasPage />
            </RutaProtegida>
          }
        />
        <Route
          path="perfil"
          element={
            <RutaProtegida>
              <Perfil />
            </RutaProtegida>
          }
        />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Rutas />
      </BrowserRouter>
    </AuthProvider>
  );
}
