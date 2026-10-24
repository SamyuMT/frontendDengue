// Cliente de la API (APIDuengue). En desarrollo Vite reenvía /v1 a http://127.0.0.1:8000.

export interface ModeloLLM {
  nombre: string;
  modelo: string;
  base_url: string | null;
  api_key_configurada: boolean;
}

export interface TareaActiva {
  tarea_id: string;
  progreso: { total: number; procesados: number; porcentaje: number };
  en_curso: Record<string, string>;
  deteniendo: boolean;
}

async function obtener<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) throw new Error(`${respuesta.status} ${respuesta.statusText}`);
  return respuesta.json() as Promise<T>;
}

export const obtenerModelos = () => obtener<ModeloLLM[]>("/v1/llm/modelos");
export const obtenerTareasEnEjecucion = () => obtener<TareaActiva[]>("/v1/tareas/en-ejecucion");
