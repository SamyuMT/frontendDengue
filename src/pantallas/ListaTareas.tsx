import { motion } from "motion/react";
import { Link, useNavigate } from "react-router";
import { useAccionesTarea } from "../componentes/AccionesTarea.tsx";
import { Boton } from "../componentes/Boton.tsx";
import { Aviso, Hoja, Vacio } from "../componentes/Hoja.tsx";
import { EstadoTareaPastilla } from "../componentes/Pastillas.tsx";
import { ESTADOS_PENDIENTES, useApp } from "../ContextoApp.tsx";
import { ETAPA, fecha, nombreTarea } from "../datos/formato.ts";

interface Props {
  tipo: "en_ejecucion" | "pendientes";
}

/** «Tareas en ejecución» y «Tareas pendientes» del Figma. */
export function ListaTareas({ tipo }: Props) {
  const { tareas, activas } = useApp();
  const navegar = useNavigate();
  const { pedir, dialogo } = useAccionesTarea();

  const crear = (
    <Boton variante="principal" icono="mas" onClick={() => navegar("/tareas/nueva")}>
      Crear tarea
    </Boton>
  );

  if (tipo === "en_ejecucion") {
    return (
      <Hoja
        titulo="Tareas en ejecución"
        descripcion="Siga el avance de los lotes que se están procesando, abra su detalle o detenga una tarea."
        pie={<div className="hoja__acciones hoja__acciones--fin">{crear}</div>}
      >
        {activas.length === 0 ? (
          <Vacio titulo="No hay tareas procesándose ahora" accion={crear}>
            Cuando cree una tarea, aquí verá su avance historia por historia. Puede cerrar esta pestaña: el proceso sigue
            mientras la ventana de la herramienta esté abierta.
          </Vacio>
        ) : (
          <>
            <table className="tabla">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th className="tabla__ancho-progreso">Avance</th>
                  <th>Estado</th>
                  <th className="tabla__acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activas.map((t) => {
                  const enCurso = Object.entries(t.en_curso);
                  return (
                    <tr key={t.tarea_id}>
                      <td>
                        <Link to={`/tareas/${t.tarea_id}`} className="tabla__titulo">
                          {nombreTarea(t)}
                        </Link>
                        <span className="tabla__meta cifra">{t.tarea_id}</span>
                      </td>
                      <td>
                        <div className="progreso">
                          <div className="progreso__barra" role="progressbar" aria-valuenow={t.progreso.porcentaje} aria-valuemin={0} aria-valuemax={100}>
                            <motion.span
                              className="progreso__relleno"
                              initial={false}
                              animate={{ scaleX: t.progreso.porcentaje / 100 }}
                              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            />
                          </div>
                          <span className="progreso__cifra cifra">{Math.round(t.progreso.porcentaje)} %</span>
                        </div>
                        <span className="tabla__meta">
                          {t.progreso.procesados} de {t.progreso.total} HC
                          {enCurso.length > 0 && ` · ${ETAPA[enCurso[0][1]] ?? enCurso[0][1]}`}
                          {enCurso.length > 1 && ` (+${enCurso.length - 1} en paralelo)`}
                        </span>
                      </td>
                      <td>
                        <EstadoTareaPastilla estado="en_ejecucion" deteniendo={t.deteniendo} />
                      </td>
                      <td className="tabla__acciones">
                        <Link to={`/tareas/${t.tarea_id}`}>Ver detalle</Link>
                        <button type="button" className="enlace" disabled={t.deteniendo} onClick={() => pedir("detener", t)}>
                          Detener
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="tabla__pie">
              <span>
                {activas.length} {activas.length === 1 ? "tarea en ejecución" : "tareas en ejecución"}
              </span>
              <span>Se procesan hasta 2 historias clínicas a la vez</span>
            </p>
            <Aviso titulo="Detener requiere confirmación">
              Antes de enviar la solicitud podrá comprobar el nombre y el ID de la tarea. La tarea se detiene al terminar la
              etapa en curso.
            </Aviso>
          </>
        )}
        {dialogo}
      </Hoja>
    );
  }

  const idsActivas = new Set(activas.map((t) => t.tarea_id));
  const pendientes = tareas.filter((t) => ESTADOS_PENDIENTES.has(t.estado) && !idsActivas.has(t.tarea_id));

  return (
    <Hoja
      titulo="Tareas pendientes"
      descripcion="Tareas detenidas, interrumpidas o con errores. Abra su detalle o reanúdelas desde donde quedaron."
      pie={<div className="hoja__acciones hoja__acciones--fin">{crear}</div>}
    >
      {pendientes.length === 0 ? (
        <Vacio titulo="No hay tareas pendientes">
          Si detiene una tarea o la herramienta se cierra mientras procesa, la tarea aparecerá aquí para reanudarla sin repetir
          las historias clínicas ya evaluadas.
        </Vacio>
      ) : (
        <>
          <table className="tabla">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Creada</th>
                <th>Estado</th>
                <th className="tabla__acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendientes.map((t) => (
                <tr key={t.tarea_id}>
                  <td>
                    <Link to={`/tareas/${t.tarea_id}`} className="tabla__titulo">
                      {nombreTarea(t)}
                    </Link>
                    <span className="tabla__meta cifra">{t.tarea_id}</span>
                  </td>
                  <td className="tabla__meta-celda">{fecha(t.creada)}</td>
                  <td>
                    <EstadoTareaPastilla estado={t.estado} />
                  </td>
                  <td className="tabla__acciones">
                    <Link to={`/tareas/${t.tarea_id}`}>Ver detalle</Link>
                    <button type="button" className="enlace" onClick={() => pedir("reanudar", t)}>
                      Reanudar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="tabla__pie">
            <span>
              {pendientes.length} {pendientes.length === 1 ? "tarea pendiente" : "tareas pendientes"}
            </span>
          </p>
          <Aviso titulo="Interrumpida significa que la herramienta se cerró mientras procesaba">
            Al reanudar, las historias clínicas que no alcanzaron a terminar se procesan de nuevo desde el inicio.
          </Aviso>
        </>
      )}
      {dialogo}
    </Hoja>
  );
}
