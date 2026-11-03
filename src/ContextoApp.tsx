import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, type ModeloLLM, type ResumenTarea, type TareaActiva } from "./api.ts";

export type Conexion = "conectando" | "ok" | "sin_conexion";

interface EstadoApp {
  conexion: Conexion;
  tareas: ResumenTarea[];
  activas: TareaActiva[];
  modelos: ModeloLLM[];
  cargado: boolean;
  recargar: () => Promise<void>;
}

const Contexto = createContext<EstadoApp | null>(null);

/** Estado que comparten la barra lateral y las pantallas: tareas, tareas activas y modelos vinculados. */
export function ProveedorApp({ children }: { children: ReactNode }) {
  const [conexion, setConexion] = useState<Conexion>("conectando");
  const [tareas, setTareas] = useState<ResumenTarea[]>([]);
  const [activas, setActivas] = useState<TareaActiva[]>([]);
  const [modelos, setModelos] = useState<ModeloLLM[]>([]);
  const [cargado, setCargado] = useState(false);
  const fallos = useRef(0);

  const recargar = useCallback(async () => {
    try {
      const [todas, enEjecucion, vinculados] = await Promise.all([api.tareas(), api.tareasEnEjecucion(), api.modelosLLM()]);
      setTareas(todas);
      setActivas(enEjecucion);
      setModelos(vinculados);
      setConexion("ok");
      setCargado(true);
      fallos.current = 0;
    } catch {
      fallos.current += 1;
      // Al abrir el .exe el servidor puede tardar unos segundos: no alarmar al primer intento.
      setConexion((actual) => (actual === "conectando" && fallos.current < 6 ? "conectando" : "sin_conexion"));
    }
  }, []);

  const hayActivas = activas.length > 0;
  useEffect(() => {
    void recargar();
    const temporizador = setInterval(() => void recargar(), hayActivas ? 2000 : 4000);
    return () => clearInterval(temporizador);
  }, [recargar, hayActivas]);

  return (
    <Contexto.Provider value={{ conexion, tareas, activas, modelos, cargado, recargar }}>{children}</Contexto.Provider>
  );
}

export function useApp(): EstadoApp {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useApp fuera de ProveedorApp");
  return valor;
}

/** Tareas que se pueden retomar: no completadas y que no estén corriendo. */
export const ESTADOS_PENDIENTES = new Set(["detenida", "interrumpida", "completada_con_errores", "error"]);
