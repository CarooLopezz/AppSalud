import { useState, type FormEvent } from "react";
import {
  crearEstudio,
  mensajeDeError,
  type NuevoEstudio,
} from "../api/estudios.ts";

interface EstudioFormProps {
  onCreado: () => void;
}

const formularioInicial: NuevoEstudio = {
  tipo: "",
  especialidad: "",
  medico: "",
  fecha: "",
  resultado: "",
  notas: "",
  proximoControl: "",
};

export default function EstudioForm({ onCreado }: EstudioFormProps) {
  const [formulario, setFormulario] = useState<NuevoEstudio>(formularioInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  function actualizarCampo(campo: keyof NuevoEstudio, valor: string) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");

    if (
      !formulario.tipo.trim() ||
      !formulario.especialidad.trim() ||
      !formulario.medico.trim() ||
      !formulario.fecha
    ) {
      setError("Completá los campos obligatorios.");
      return;
    }

    setGuardando(true);

    try {
      await crearEstudio({
        ...formulario,
        tipo: formulario.tipo.trim(),
        especialidad: formulario.especialidad.trim(),
        medico: formulario.medico.trim(),
        resultado: formulario.resultado?.trim() || undefined,
        notas: formulario.notas?.trim() || undefined,
        proximoControl: formulario.proximoControl || undefined,
      });

      setFormulario(formularioInicial);
      onCreado();
    } catch (error) {
      setError(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={manejarEnvio}>
      <h2>Registrar estudio</h2>
      <p>Completá los datos del estudio realizado.</p>

      <div className="campos">
        <label>
          Tipo de estudio *
          <input
            value={formulario.tipo}
            onChange={(e) => actualizarCampo("tipo", e.target.value)}
            placeholder="Ej.: Análisis de sangre"
            required
          />
        </label>

        <label>
          Especialidad *
          <input
            value={formulario.especialidad}
            onChange={(e) => actualizarCampo("especialidad", e.target.value)}
            placeholder="Ej.: Cardiología"
            required
          />
        </label>

        <label>
          Médico *
          <input
            value={formulario.medico}
            onChange={(e) => actualizarCampo("medico", e.target.value)}
            placeholder="Nombre del médico"
            required
          />
        </label>

        <label>
          Fecha del estudio *
          <input
            type="date"
            value={formulario.fecha}
            onChange={(e) => actualizarCampo("fecha", e.target.value)}
            required
          />
        </label>

        <label>
          Fecha del próximo control
          <input
            type="date"
            value={formulario.proximoControl ?? ""}
            onChange={(e) => actualizarCampo("proximoControl", e.target.value)}
          />
        </label>

        <label>
          Resultado
          <textarea
            value={formulario.resultado ?? ""}
            onChange={(e) => actualizarCampo("resultado", e.target.value)}
            placeholder="Resultado del estudio"
            rows={3}
          />
        </label>

        <label>
          Notas
          <textarea
            value={formulario.notas ?? ""}
            onChange={(e) => actualizarCampo("notas", e.target.value)}
            placeholder="Observaciones adicionales"
            rows={3}
          />
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <button
        className="boton boton-primario"
        type="submit"
        disabled={guardando}
      >
        {guardando ? "Guardando..." : "Guardar estudio"}
      </button>
    </form>
  );
}
