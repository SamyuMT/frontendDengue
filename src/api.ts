// Cliente de la API (APIDuengue). Rutas relativas: en el .exe el backend sirve este front en el mismo
// puerto; en desarrollo Vite reenvía /v1 a http://127.0.0.1:8000. Tipos espejo de app/schemas/.

// --- Tareas ---------------------------------------------------------------

export type EstadoTarea =
  | "en_ejecucion"
  | "completada"
  | "completada_con_errores"
  | "detenida"
  | "interrumpida"
  | "error";

export type EstadoDocumento = "pendiente" | "en_proceso" | "completado" | "error";
export type Nivel = "BAJO" | "MEDIO" | "ALTO";

/** Claves de módulos e indicadores (config/indicador.yaml). */
export type ClaveModulo = "evaluacion_general" | "diagnostico" | "manejo_ambulatorio" | "manejo_hospitalario" | "manejo_uci";
export type ClaveIndicador = "evaluacion_general" | "diagnostico" | "manejo" | "total";

export interface IndicadorHC {
  modulos: Partial<Record<ClaveModulo, number | null>>;
  indicadores: Partial<Record<ClaveIndicador, number | null>>;
  niveles: Partial<Record<ClaveModulo | ClaveIndicador, Nivel>>;
  confiable?: boolean;
  items_fallo_llm?: string[];
}

export interface DocumentoTarea {
  archivo: string;
  estado: EstadoDocumento;
  etapa: string | null;
  error: string | null;
  tiempos: Record<string, number>;
  indicador: IndicadorHC | null;
}

export interface Progreso {
  total: number;
  procesados: number;
  completados: number;
  errores: number;
  porcentaje: number;
}

export interface ReporteGeneral {
  total_hc: number;
  general: Partial<Record<ClaveModulo | ClaveIndicador, number | null>>;
  niveles_general: Partial<Record<ClaveModulo | ClaveIndicador, Nivel>>;
  confiable?: boolean;
  hc_no_confiables?: string[];
}

export interface Tarea {
  tarea_id: string;
  nombre: string | null;
  estado: EstadoTarea;
  carpeta_entrada: string;
  carpeta_salida: string;
  creada: string;
  finalizada: string | null;
  documentos: Record<string, DocumentoTarea>;
  resumen: Record<string, number> | null;
  error: string | null;
  extractor: string;
  segmentar: boolean;
  modelo_embeddings: string;
  modelo_llm: string | null;
  reportes: string[];
  reporte_general: ReporteGeneral | null;
  progreso: Progreso;
  etapas: string[];
}

export interface ResumenTarea {
  tarea_id: string;
  nombre: string | null;
  estado: EstadoTarea;
  creada: string;
}

export interface TareaActiva {
  tarea_id: string;
  nombre: string | null;
  creada: string;
  extractor: string;
  modelo_llm: string | null;
  progreso: Progreso;
  en_curso: Record<string, string>;
  deteniendo: boolean;
}

export interface CrearTareaDatos {
  nombre: string;
  carpeta_entrada: string;
  extractor: string;
  segmentar: boolean;
  modelo_embeddings: string;
  modelo_llm: string;
}

// --- Documentos, modelos y sistema ----------------------------------------

export interface ArchivoPdf {
  name: string;
  size_bytes: number;
  path: string;
}

export interface ListaPdf {
  total: number;
  files: ArchivoPdf[];
}

export interface ModelosLocales {
  embeddings: string[];
  embeddings_por_defecto: string;
  extractores: string[];
}

export interface ModeloLLM {
  nombre: string;
  tipo: "openai_compatible" | "anthropic";
  proveedor: string | null;
  modelo: string;
  base_url: string | null;
  api_key_env: string | null;
  timeout_s: number;
  api_key_configurada: boolean;
}

export interface VincularModeloDatos {
  nombre: string;
  modelo: string;
  base_url: string | null;
  api_key_env: string | null;
  api_key?: string | null;
  timeout_s: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  tipo: "openai_compatible" | "anthropic";
  base_url: string | null;
  api_key_env: string;
  habilitado: boolean;
  api_key_configurada: boolean;
}

export interface ModeloDisponible {
  id: string;
  nombre: string;
}

export interface RespuestaLLM {
  modelo: string;
  respuesta: string;
  tiempo_segundos: number;
  tokens_totales: number | null;
}

// --- Cliente --------------------------------------------------------------

/** Error de la API con el mensaje del backend (`detail`) listo para mostrar. */
export class ErrorApi extends Error {
  readonly estado: number;

  constructor(estado: number, mensaje: string) {
    super(mensaje);
    this.estado = estado;
  }
}

async function pedir<T>(ruta: string, opciones: { metodo?: string; cuerpo?: unknown } = {}): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(ruta, {
      method: opciones.metodo ?? "GET",
      headers: opciones.cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
    });
  } catch {
    throw new ErrorApi(0, "No hay conexión con el servidor de la herramienta.");
  }
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, await mensajeDeError(respuesta));
  }
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}

async function mensajeDeError(respuesta: Response): Promise<string> {
  try {
    const datos = (await respuesta.json()) as { detail?: unknown };
    if (typeof datos.detail === "string") return datos.detail;
    if (Array.isArray(datos.detail)) return "Hay datos inválidos en el formulario.";
  } catch {
    /* sin cuerpo JSON */
  }
  return `El servidor respondió ${respuesta.status}.`;
}

const id = (tareaId: string) => encodeURIComponent(tareaId);

export const api = {
  // Tareas
  tareas: () => pedir<ResumenTarea[]>("/v1/tareas"),
  tareasEnEjecucion: () => pedir<TareaActiva[]>("/v1/tareas/en-ejecucion"),
  tarea: (tareaId: string) => pedir<Tarea>(`/v1/tareas/${id(tareaId)}`),
  crearTarea: (datos: CrearTareaDatos) => pedir<{ tarea_id: string }>("/v1/tareas", { metodo: "POST", cuerpo: datos }),
  reanudar: (tareaId: string) => pedir<{ tarea_id: string }>(`/v1/tareas/${id(tareaId)}/reanudar`, { metodo: "POST" }),
  detener: (tareaId: string) => pedir<{ mensaje: string }>(`/v1/tareas/${id(tareaId)}/detener`, { metodo: "POST" }),
  eliminar: (tareaId: string) => pedir<void>(`/v1/tareas/${id(tareaId)}`, { metodo: "DELETE" }),
  abrirCarpeta: (tareaId: string) => pedir<{ mensaje: string }>(`/v1/tareas/${id(tareaId)}/abrir-carpeta`, { metodo: "POST" }),
  urlReporte: (tareaId: string, formato: "xlsx" | "json") => `/v1/tareas/${id(tareaId)}/reporte/${formato}`,

  // Documentos y sistema
  listarPdf: (carpeta: string) => pedir<ListaPdf>("/v1/documents/list", { metodo: "POST", cuerpo: { folder: carpeta } }),
  elegirCarpeta: (inicial?: string) =>
    pedir<{ ruta: string | null }>("/v1/sistema/elegir-carpeta", { metodo: "POST", cuerpo: { inicial: inicial || null } }),
  modelosLocales: () => pedir<ModelosLocales>("/v1/modelos/locales"),

  // Modelos LLM
  modelosLLM: () => pedir<ModeloLLM[]>("/v1/llm/modelos"),
  vincularModelo: (datos: VincularModeloDatos) => pedir<ModeloLLM>("/v1/llm/modelos", { metodo: "POST", cuerpo: datos }),
  proveedores: () => pedir<Proveedor[]>("/v1/llm/proveedores"),
  modelosDisponibles: (proveedor: string, apiKey?: string, baseUrl?: string) =>
    pedir<ModeloDisponible[]>(`/v1/llm/proveedores/${proveedor}/modelos-disponibles`, {
      metodo: "POST",
      cuerpo: { api_key: apiKey || null, base_url: baseUrl || null },
    }),
  vincularVarios: (proveedor: string, datos: { modelos: string[]; api_key?: string | null; base_url?: string | null; timeout_s: number }) =>
    pedir<ModeloLLM[]>(`/v1/llm/proveedores/${proveedor}/vincular`, { metodo: "POST", cuerpo: datos }),
  desvincularModelo: (nombre: string) => pedir<void>(`/v1/llm/modelos/${encodeURIComponent(nombre)}`, { metodo: "DELETE" }),
  probarModelo: (nombre: string) =>
    pedir<RespuestaLLM>("/v1/llm/consulta", {
      metodo: "POST",
      cuerpo: { modelo: nombre, prompt: "Responde únicamente con la palabra: OK", temperatura: 0, max_tokens: 5 },
    }),
};
