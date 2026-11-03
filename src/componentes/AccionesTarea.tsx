import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { api } from "../api.ts";
import { useApp } from "../ContextoApp.tsx";
import { nombreTarea } from "../datos/formato.ts";
import { Dialogo } from "./Dialogo.tsx";

export type Accion = "detener" | "reanudar" | "eliminar";

interface Objetivo {
  tarea_id: string;
  nombre: string | null;
  creada: string;
}

const TEXTOS: Record<Accion, { titulo: string; boton: string; icono: "detener" | "reanudar" | "eliminar" }> = {
  detener: { titulo: "¿Detener esta tarea?", boton: "Detener tarea", icono: "detener" },
  reanudar: { titulo: "¿Reanudar esta tarea?", boton: "Reanudar", icono: "reanudar" },
  eliminar: { titulo: "¿Eliminar esta tarea?", boton: "Eliminar", icono: "eliminar" },
};

/** Detener, reanudar y eliminar con su diálogo de confirmación (pantallas «Detener/Reanudar/Eliminar tarea» del Figma). */
export function useAccionesTarea(alTerminar?: (accion: Accion) => void) {
  const { recargar } = useApp();
  const navegar = useNavigate();
  const [pendiente, setPendiente] = useState<{ accion: Accion; tarea: Objetivo } | null>(null);
  const [ejecutando, setEjecutando] = useState(false);

  const pedir = useCallback((accion: Accion, tarea: Objetivo) => setPendiente({ accion, tarea }), []);
  const cerrar = useCallback(() => setPendiente(null), []);

  async function confirmar() {
    if (!pendiente) return;
    const { accion, tarea } = pendiente;
    setEjecutando(true);
    try {
      if (accion === "detener") {
        await api.detener(tarea.tarea_id);
        toast("Deteniendo la tarea", { description: "Termina la etapa en curso de cada HC y queda lista para reanudar." });
      } else if (accion === "reanudar") {
        await api.reanudar(tarea.tarea_id);
        toast.success("Tarea reanudada", { description: "Se procesan solo las HC que faltaban." });
      } else {
        await api.eliminar(tarea.tarea_id);
        toast.success("Tarea eliminada", { description: "Los resultados siguen en su carpeta." });
        navegar("/tareas/pendientes");
      }
      await recargar();
      alTerminar?.(accion);
      setPendiente(null);
    } catch (e) {
      toast.error("No se pudo completar la acción", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setEjecutando(false);
    }
  }

  const textos = pendiente ? TEXTOS[pendiente.accion] : TEXTOS.detener;
  const nombre = pendiente ? nombreTarea(pendiente.tarea) : "";

  const dialogo = (
    <Dialogo
      abierto={pendiente !== null}
      titulo={textos.titulo}
      icono={textos.icono}
      tono={pendiente?.accion === "eliminar" ? "peligro" : "normal"}
      textoConfirmar={textos.boton}
      confirmando={ejecutando}
      onConfirmar={() => void confirmar()}
      onCerrar={cerrar}
    >
      <dl className="dialogo__ficha">
        <div>
          <dt>Tarea</dt>
          <dd>{nombre}</dd>
        </div>
        <div>
          <dt>ID</dt>
          <dd className="cifra">{pendiente?.tarea.tarea_id}</dd>
        </div>
      </dl>
      {pendiente?.accion === "detener" && (
        <p>
          La tarea se detiene al terminar la etapa en curso de cada historia clínica; la evaluación con IA puede tardar unos
          minutos. Las HC sin terminar quedan pendientes y podrá reanudarla después.
        </p>
      )}
      {pendiente?.accion === "reanudar" && (
        <p>Se procesarán solo las historias clínicas que no se completaron. Las que ya terminaron conservan su resultado.</p>
      )}
      {pendiente?.accion === "eliminar" && (
        <p>
          Se borra el registro de la tarea de esta lista. <strong>Los reportes y archivos de resultados no se borran</strong>: siguen en
          su carpeta de resultados.
        </p>
      )}
    </Dialogo>
  );

  return { pedir, dialogo };
}
