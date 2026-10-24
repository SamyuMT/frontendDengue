import { useEffect, useState } from "react";
import { obtenerModelos, obtenerTareasEnEjecucion, type ModeloLLM, type TareaActiva } from "./api.ts";

type EstadoConexion = "loading" | "ok" | "error";

function App() {
  const [conexion, setConexion] = useState<EstadoConexion>("loading");
  const [modelos, setModelos] = useState<ModeloLLM[]>([]);
  const [tareas, setTareas] = useState<TareaActiva[]>([]);

  useEffect(() => {
    const consultar = () => {
      Promise.all([obtenerTareasEnEjecucion(), obtenerModelos()])
        .then(([activas, vinculados]) => {
          setTareas(activas);
          setModelos(vinculados);
          setConexion("ok");
        })
        .catch(() => setConexion("error"));
    };

    consultar();
    const intervalo = setInterval(consultar, 5000);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <>
      <header className="app-header">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="#4f8ef7" opacity="0.15" />
          <path d="M7 14h14M14 7v14" stroke="#4f8ef7" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <h1>GPC-Dengue — Análisis de Adherencia</h1>
        <span className="badge">v0.1.0</span>
        <span
          className={`status-dot ${conexion}`}
          title={conexion === "ok" ? "API conectada" : conexion === "error" ? "API no disponible" : "Conectando..."}
        />
      </header>

      <main className="app-main">
        <div className="card">
          <h2>Estado del sistema</h2>
          {conexion === "loading" && (
            <div className="placeholder">
              <span>⏳</span>
              Conectando con la API en http://127.0.0.1:8000…
            </div>
          )}
          {conexion === "error" && (
            <div className="placeholder">
              <span>⚠️</span>
              No se puede conectar con el backend. Asegúrate de que el servidor está corriendo:<br />
              <code>python -m uvicorn app.main:app --reload</code>
            </div>
          )}
          {conexion === "ok" && (
            <>
              <p className="mensaje-ok">✓ API conectada correctamente</p>
              <p className="subtitulo">Tareas en ejecución: {tareas.length}</p>
              <p className="subtitulo">Modelos LLM vinculados:</p>
              {modelos.length > 0 ? (
                <div className="health-grid">
                  {modelos.map((m) => (
                    <div className="provider-chip" key={m.nombre}>
                      <span className="name" title={m.modelo}>{m.nombre}</span>
                      <span className={`state ${m.api_key_configurada ? "closed" : "open"}`}>
                        {m.api_key_configurada ? "llave ok" : "sin llave"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="subtitulo">
                  No hay modelos vinculados. Usa <code>POST /v1/llm/modelos</code>.
                </p>
              )}
            </>
          )}
        </div>

        <div className="card">
          <h2>Módulos</h2>
          <div className="placeholder">
            <span>🏗️</span>
            Los módulos (tareas, reportes, modelos LLM) se construirán en los siguientes pasos.
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
