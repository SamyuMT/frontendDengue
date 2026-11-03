import type { EstadoDocumento, EstadoTarea, Nivel } from "../api.ts";
import { ESTADO_DOCUMENTO, ESTADO_TAREA } from "../datos/formato.ts";
import { Icono } from "./Icono.tsx";

const TONO_TAREA: Record<EstadoTarea, string> = {
  en_ejecucion: "activo",
  completada: "neutro",
  completada_con_errores: "aviso",
  detenida: "neutro",
  interrumpida: "aviso",
  error: "error",
};

export function EstadoTareaPastilla({ estado, deteniendo = false }: { estado: EstadoTarea; deteniendo?: boolean }) {
  if (deteniendo) return <span className="pastilla pastilla--aviso">Deteniendo…</span>;
  return (
    <span className={`pastilla pastilla--${TONO_TAREA[estado]}`}>
      {estado === "en_ejecucion" && <span className="pastilla__pulso" aria-hidden />}
      {estado === "completada" && <Icono nombre="checkCirculo" tamano={14} />}
      {ESTADO_TAREA[estado]}
    </span>
  );
}

const TONO_DOC: Record<EstadoDocumento, string> = {
  pendiente: "neutro",
  en_proceso: "activo",
  completado: "neutro",
  error: "error",
};

export function EstadoDocumentoPastilla({ estado }: { estado: EstadoDocumento }) {
  return (
    <span className={`pastilla pastilla--${TONO_DOC[estado]}`}>
      {estado === "completado" && <Icono nombre="checkCirculo" tamano={14} />}
      {ESTADO_DOCUMENTO[estado]}
    </span>
  );
}

const ICONO_NIVEL = { BAJO: "bajo", MEDIO: "medio", ALTO: "alto" } as const;

/** Nivel de adherencia: siempre texto + ícono, nunca solo color. */
export function NivelPastilla({ nivel, grande = false }: { nivel: Nivel | undefined; grande?: boolean }) {
  if (!nivel) return <span className="pastilla pastilla--neutro">Sin dato</span>;
  return (
    <span className={`nivel nivel--${nivel.toLowerCase()}${grande ? " nivel--grande" : ""}`}>
      <Icono nombre={ICONO_NIVEL[nivel]} tamano={grande ? 14 : 12} />
      {nivel}
    </span>
  );
}
