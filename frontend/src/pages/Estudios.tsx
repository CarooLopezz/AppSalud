import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TOKEN_KEY } from "../api/clients.ts";
import {
  formatearFecha,
  listarEstudios,
  listarProximosControles,
  mensajeDeError,
  type Estudio,
  type FiltrosEstudios,
} from "../api/estudios.ts";
import EstudioForm from "../components/EstudioForm.tsx";
import ProximosControles from "../components/ProximosControles.tsx";

export default function Estudios() {
  const [estudios, setEstudios] = useState<Estudio[]>([]);
  const [controles, setControles] = useState<Estudio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [actualizacion, setActualizacion] = useState(0);

  const [filtros, setFiltros] = useState<FiltrosEstudios>({
    especialidad: "",
    tipo: "",
    medico: "",
    fecha: "",
  });

  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosEstudios>({});
  const [tieneSesion] = useState(() =>
    Boolean(localStorage.getItem(TOKEN_KEY)),
  );

  useEffect(() => {
    if (!tieneSesion) return;

    let activo = true;

    async function cargarDatos() {
      try {
        const [lista, proximos] = await Promise.all([
          listarEstudios(filtrosAplicados),
          listarProximosControles(),
        ]);

        if (activo) {
          setEstudios(lista);
          setControles(proximos);
          setError("");
        }
      } catch (error) {
        if (activo) {
          setError(mensajeDeError(error));
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargarDatos();

    return () => {
      activo = false;
    };
  }, [filtrosAplicados, tieneSesion, actualizacion]);

  const especialidades = useMemo(
    () => [...new Set(estudios.map((estudio) => estudio.especialidad))],
    [estudios],
  );

  function actualizarFiltro(campo: keyof FiltrosEstudios, valor: string) {
    setFiltros((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function aplicarFiltros(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setFiltrosAplicados({ ...filtros });
  }

  function limpiarFiltros() {
    setFiltros({
      especialidad: "",
      tipo: "",
      medico: "",
      fecha: "",
    });
    setFiltrosAplicados({});
  }

  function estudioCreado() {
    setMostrarFormulario(false);
    setActualizacion((anterior) => anterior + 1);
  }

  if (!tieneSesion) {
    return (
      <main className="pagina-estudios">
        <section className="vacio">
          <h1>Mis estudios</h1>
          <p>Iniciá sesión para consultar y registrar tus estudios médicos.</p>
          <Link className="boton boton-primario" to="/login">
            Iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="pagina-estudios">
      <header className="encabezado-pagina">
        <div>
          <h1>Mis estudios</h1>
          <p>Consultá tus estudios médicos y próximos controles.</p>
        </div>

        <button
          className="boton boton-primario"
          type="button"
          onClick={() => setMostrarFormulario((anterior) => !anterior)}
        >
          {mostrarFormulario ? "Cancelar" : "+ Registrar estudio"}
        </button>
      </header>

      <ProximosControles controles={controles} cargando={cargando} />

      {mostrarFormulario && <EstudioForm onCreado={estudioCreado} />}

      <section className="seccion-estudios">
        <h2>Historial de estudios</h2>

        <form className="filtros" onSubmit={aplicarFiltros}>
          <label>
            Especialidad
            <select
              value={filtros.especialidad}
              onChange={(e) => actualizarFiltro("especialidad", e.target.value)}
            >
              <option value="">Todas</option>
              {especialidades.map((especialidad) => (
                <option key={especialidad} value={especialidad}>
                  {especialidad}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tipo de estudio
            <input
              value={filtros.tipo}
              onChange={(e) => actualizarFiltro("tipo", e.target.value)}
              placeholder="Ej.: Análisis"
            />
          </label>

          <label>
            Médico
            <input
              value={filtros.medico}
              onChange={(e) => actualizarFiltro("medico", e.target.value)}
              placeholder="Nombre del médico"
            />
          </label>

          <label>
            Fecha
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => actualizarFiltro("fecha", e.target.value)}
            />
          </label>

          <div className="acciones">
            <button className="boton boton-primario" type="submit">
              Filtrar
            </button>
            <button className="boton" type="button" onClick={limpiarFiltros}>
              Limpiar
            </button>
          </div>
        </form>

        {error && (
          <div className="error">
            <p>{error}</p>
            <button
              className="boton"
              type="button"
              onClick={() => setActualizacion((v) => v + 1)}
            >
              Reintentar
            </button>
          </div>
        )}

        {cargando ? (
          <p>Cargando estudios...</p>
        ) : error ? null : estudios.length === 0 ? (
          <div className="vacio">
            <h3>No se encontraron estudios</h3>
            <p>
              Todavía no hay estudios registrados o no existen resultados para
              los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="lista-estudios">
            {estudios.map((estudio) => (
              <article className="estudio" key={estudio.id}>
                <div className="estudio-cabecera">
                  <div>
                    <h3>{estudio.tipo}</h3>
                    <span className="etiqueta">{estudio.especialidad}</span>
                  </div>
                  <span>{formatearFecha(estudio.fecha)}</span>
                </div>

                <div className="estudio-meta">
                  <p>
                    <strong>Médico:</strong> {estudio.medico}
                  </p>
                  {estudio.resultado && (
                    <p>
                      <strong>Resultado:</strong> {estudio.resultado}
                    </p>
                  )}
                  {estudio.notas && (
                    <p>
                      <strong>Notas:</strong> {estudio.notas}
                    </p>
                  )}
                  {estudio.proximoControl && (
                    <p>
                      <strong>Próximo control:</strong>{" "}
                      {formatearFecha(estudio.proximoControl)}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
