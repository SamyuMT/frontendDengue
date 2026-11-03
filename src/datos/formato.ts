import type { EstadoDocumento, EstadoTarea, ModeloLLM, Nivel } from "../api.ts";

const numero = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaHora = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const fechaCorta = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" });

/** 3.0 → "3,00"; null → "—". */
export const calificacion = (valor: number | null | undefined) =>
  valor === null || valor === undefined ? "—" : numero.format(valor);

export const fecha = (iso: string | null | undefined) => (iso ? fechaHora.format(new Date(iso)) : "—");
export const fechaDia = (iso: string) => fechaCorta.format(new Date(iso));

export function tamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;
}

export function duracion(segundos: number): string {
  if (segundos < 60) return `${Math.round(segundos)} s`;
  const minutos = Math.floor(segundos / 60);
  return `${minutos} min ${Math.round(segundos % 60)} s`;
}

export const ESTADO_TAREA: Record<EstadoTarea, string> = {
  en_ejecucion: "En ejecución",
  completada: "Completada",
  completada_con_errores: "Completada con errores",
  detenida: "Detenida",
  interrumpida: "Interrumpida",
  error: "Error",
};

export const ESTADO_DOCUMENTO: Record<EstadoDocumento, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completado: "Completado",
  error: "Error",
};

/** Nombres de las etapas del pipeline para el auditor (en el orden de flujo.py). */
export const ETAPA: Record<string, string> = {
  extraer: "Extrayendo texto",
  limpiar: "Limpiando",
  anonimizar: "Anonimizando",
  normalizar: "Normalizando",
  filtrar: "Filtrando secciones",
  evaluar_llm: "Evaluando con IA",
  calcular_indicador: "Calculando indicador",
  en_cola: "En cola",
};

export const ETAPA_CORTA: Record<string, string> = {
  extraer: "Extraer",
  limpiar: "Limpiar",
  anonimizar: "Anonimizar",
  normalizar: "Normalizar",
  filtrar: "Filtrar",
  evaluar_llm: "Evaluar con IA",
  calcular_indicador: "Indicador",
};

export const MODULO: Record<string, string> = {
  evaluacion_general: "Evaluación general",
  diagnostico: "Diagnóstico",
  manejo: "Manejo",
  manejo_ambulatorio: "Manejo ambulatorio",
  manejo_hospitalario: "Manejo hospitalario",
  manejo_uci: "Manejo UCI",
  total: "Adherencia total",
};

/** Nivel según config/indicador.yaml: BAJO < 3, MEDIO 3–<4, ALTO ≥ 4. */
export function nivelDe(valor: number): Nivel {
  if (valor >= 4) return "ALTO";
  if (valor >= 3) return "MEDIO";
  return "BAJO";
}

export const nombreTarea = (t: { nombre: string | null; creada: string }) => t.nombre || `Lote del ${fechaDia(t.creada)}`;

/** Proveedor legible a partir de la base_url de un modelo vinculado. */
export function proveedor(modelo: Pick<ModeloLLM, "base_url">): { nombre: string; local: boolean } {
  const url = modelo.base_url ?? "";
  if (!url) return { nombre: "OpenAI", local: false };
  if (/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(url)) {
    if (url.includes("11434")) return { nombre: "Ollama", local: true };
    if (url.includes("1234")) return { nombre: "LM Studio", local: true };
    return { nombre: "Servidor local", local: true };
  }
  if (url.includes("deepseek")) return { nombre: "DeepSeek", local: false };
  if (url.includes("googleapis") || url.includes("gemini")) return { nombre: "Google Gemini", local: false };
  if (url.includes("anthropic")) return { nombre: "Anthropic", local: false };
  if (url.includes("openai")) return { nombre: "OpenAI", local: false };
  try {
    return { nombre: new URL(url).hostname, local: false };
  } catch {
    return { nombre: url, local: false };
  }
}
