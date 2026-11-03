import type { Estudio } from "../api/estudios.ts";
import { formatearFecha } from "../api/estudios.ts";

interface ProximosControlesProps {
  controles: Estudio[];
  cargando: boolean;
}

export default function ProximosControles({
  controles,
  cargando,
}: ProximosControlesProps) {
  if (cargando) {
    return (
      <section className="alerta">
        <p>Cargando próximos controles...</p>
      </section>
    );
  }

  if (controles.length === 0) {
    return (
      <section className="alerta alerta-ok">
        <h3>¡Todo al día!</h3>
        <p>No tenés próximos controles registrados.</p>
      </section>
    );
  }

  return (
    <section className="alerta">
      <h3>Próximos controles</h3>
      <p>Estos son los controles que tenés programados:</p>

      <ul className="alerta-lista">
        {controles.map((control) => (
          <li key={control.id}>
            <strong>{control.tipo}</strong>
            {" · "}
            {control.especialidad}
            {" · "}
            {control.proximoControl
              ? formatearFecha(control.proximoControl)
              : "Fecha no disponible"}
            {control.medico && ` · ${control.medico}`}
          </li>
        ))}
      </ul>
    </section>
  );
}
