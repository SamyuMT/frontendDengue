import { NavLink, useNavigate } from "react-router";
import { ESTADOS_PENDIENTES, useApp } from "../ContextoApp.tsx";
import { ESTADO_TAREA, nombreTarea } from "../datos/formato.ts";
import { Icono } from "./Icono.tsx";

/** Barra lateral del Figma: producto, accesos con contador, tareas creadas y modelos de IA. */
export function BarraLateral() {
  const { tareas, activas, modelos, conexion } = useApp();
  const navegar = useNavigate();
  const idsActivas = new Set(activas.map((t) => t.tarea_id));
  const pendientes = tareas.filter((t) => ESTADOS_PENDIENTES.has(t.estado) && !idsActivas.has(t.tarea_id)).length;

  return (
    <aside className="lateral" aria-label="Navegación">
      <div className="lateral__marca">
        <img src="favicon.svg" width={44} height={43} alt="" className="lateral__simbolo" />
        <p className="lateral__nombre">
          Herramienta para medir <span>Adherencia a Dengue</span>
        </p>
      </div>

      <button type="button" className="lateral__nueva" onClick={() => navegar("/tareas/nueva")}>
        <Icono nombre="mas" tamano={17} />
        Nueva tarea
      </button>

      <nav className="lateral__nav">
        <NavLink to="/tareas/en-ejecucion" className="lateral__enlace">
          <span>Tareas en ejecución</span>
          <span className="lateral__contador cifra">
            {activas.length > 0 && <span className="lateral__latido" aria-hidden />}
            {activas.length}
          </span>
        </NavLink>
        <NavLink to="/tareas/pendientes" className="lateral__enlace">
          <span>Tareas pendientes</span>
          <span className="lateral__contador cifra">{pendientes}</span>
        </NavLink>
      </nav>

      <div className="lateral__seccion">
        <p className="lateral__subtitulo">
          <span>Tareas creadas</span>
          <span className="cifra">{tareas.length}</span>
        </p>
        {tareas.length === 0 ? (
          <p className="lateral__vacio">{conexion === "ok" ? "Aún no hay tareas creadas." : "Cargando tareas…"}</p>
        ) : (
          <ul className="lateral__tareas">
            {tareas.map((t) => {
              const estado = idsActivas.has(t.tarea_id) ? "en_ejecucion" : t.estado;
              return (
                <li key={t.tarea_id}>
                  <NavLink to={`/tareas/${t.tarea_id}`} className="lateral__tarea">
                    <span className="lateral__tarea-nombre">{nombreTarea(t)}</span>
                    <span className="lateral__tarea-meta">
                      {estado === "en_ejecucion" && <span className="lateral__latido" aria-hidden />}
                      {ESTADO_TAREA[estado]}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <NavLink to="/modelos" className="lateral__enlace lateral__modelos">
        <Icono nombre="chip" tamano={18} />
        <span>Modelos de IA</span>
        <span className="lateral__contador cifra">{modelos.length}</span>
      </NavLink>
    </aside>
  );
}
