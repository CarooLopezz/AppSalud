import { estudiosApi } from "./clients.ts";
import { errorMessage } from "./errorMessage.ts";

export interface Estudio {
  id: string;
  tipo: string;
  especialidad: string;
  medico: string;
  fecha: string;
  resultado?: string;
  notas?: string;
  proximoControl?: string;
}

export interface NuevoEstudio {
  tipo: string;
  especialidad: string;
  medico: string;
  fecha: string;
  resultado?: string;
  notas?: string;
  proximoControl?: string;
}

export interface FiltrosEstudios {
  especialidad?: string;
  tipo?: string;
  medico?: string;
  fecha?: string;
}

type EstudioCrudo = Omit<Estudio, "id"> & {
  _id: string;
  id?: string;
};

function normalizar(estudio: EstudioCrudo): Estudio {
  const { _id, id, ...resto } = estudio;
  return { ...resto, id: id ?? _id };
}

export async function listarEstudios(
  filtros: FiltrosEstudios = {},
): Promise<Estudio[]> {
  const params = Object.fromEntries(
    Object.entries(filtros).filter(([, valor]) => valor?.trim()),
  );

  const { data } = await estudiosApi.get<EstudioCrudo[]>("/estudios", {
    params,
  });

  return data.map(normalizar);
}

export async function listarProximosControles(): Promise<Estudio[]> {
  const { data } = await estudiosApi.get<EstudioCrudo[]>(
    "/estudios/proximos-controles",
  );

  return data.map(normalizar);
}

export async function crearEstudio(estudio: NuevoEstudio): Promise<Estudio> {
  const { data } = await estudiosApi.post<EstudioCrudo>("/estudios", estudio);

  return normalizar(data);
}

export function formatearFecha(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(fecha));
}

export function mensajeDeError(error: unknown): string {
  return errorMessage(
    error,
    "No se pudo conectar con el servicio de estudios.",
  );
}
