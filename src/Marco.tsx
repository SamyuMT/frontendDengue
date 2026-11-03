import { AnimatePresence, motion } from "motion/react";
import { Navigate, Outlet, useLocation } from "react-router";
import { BarraLateral } from "./componentes/BarraLateral.tsx";
import { Esqueleto } from "./componentes/Hoja.tsx";
import { useApp } from "./ContextoApp.tsx";
import { onboardingVisto } from "./pantallas/Bienvenida.tsx";

/** Estructura común: barra lateral + área de trabajo. Avisa si el servidor no responde. */
export function Marco() {
  const { conexion, cargado } = useApp();
  const ubicacion = useLocation();

  return (
    <div className="marco">
      <BarraLateral />
      <main className="trabajo">
        <AnimatePresence>
          {conexion !== "ok" && (
            <motion.div
              className={`conexion conexion--${conexion}`}
              role="status"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <span className="conexion__punto" aria-hidden />
              {conexion === "conectando"
                ? "Conectando con el servidor de la herramienta…"
                : "Sin conexión con el servidor. Si cerró la ventana negra (terminal), vuelva a abrir la herramienta."}
            </motion.div>
          )}
        </AnimatePresence>
        {cargado ? (
          <Outlet key={ubicacion.pathname} />
        ) : (
          <section className="hoja">
            <Esqueleto filas={4} />
          </section>
        )}
      </main>
    </div>
  );
}

/** «/»: primera vez → bienvenida; con tareas corriendo → en ejecución; si no → crear tarea. */
export function Inicio() {
  const { activas } = useApp();
  if (!onboardingVisto()) return <Navigate to="/bienvenida" replace />;
  return <Navigate to={activas.length > 0 ? "/tareas/en-ejecucion" : "/tareas/nueva"} replace />;
}
