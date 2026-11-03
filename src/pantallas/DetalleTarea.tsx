import { motion } from "motion/react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { api, ErrorApi } from "../api.ts";
import { useAccionesTarea } from "../componentes/AccionesTarea.tsx";
import { Boton } from "../componentes/Boton.tsx";
import { Aviso, Esqueleto, Hoja, Vacio } from "../componentes/Hoja.tsx";
import { Icono } from "../componentes/Icono.tsx";
import { EstadoDocumentoPastilla, EstadoTareaPastilla, NivelPastilla } from "../componentes/Pastillas.tsx";
import { PistaEtapas } from "../componentes/PistaEtapas.tsx";
import { useApp } from "../ContextoApp.tsx";
import { calificacion, duracion, ETAPA, fecha, nombreTarea } from "../datos/formato.ts";
import { usePolling } from "../hooks/usePolling.ts";
import { EvaluacionFinal } from "./EvaluacionFinal.tsx";

const EXTRACTOR: Record<string, string> = { pymupdf: "Rápido (PyMuPDF)", pdfplumber: "Detallado (pdfplumber)" };

export function DetalleTarea() {
  const { tareaId = "" } = useParams();
  const { activas } = useApp();
  const activa = activas.find((t) => t.tarea_id === tareaId);
  const corriendo = Boolean(activa);
  const { datos: tarea, error, cargando, recargar } = usePolling(() => api.tarea(tareaId), corriendo ? 2000 : 6000, [tareaId]);
  const { pedir, dialogo } = useAccionesTarea(() => void recargar());
  const [abriendo, setAbriendo] = useState(false);

  if (cargando && !tarea) {
    return (
      <section className="hoja">
        <Esqueleto filas={6} />
      </section>
    );
  }
  if (!tarea) {
    const noExiste = error instanceof ErrorApi && error.estado === 404;
    return (
      <Hoja titulo={noExiste ? "Tarea no encontrada" : "No se pudo cargar la tarea"}>
        <Vacio titulo={noExiste ? "Esta tarea ya no existe" : "Revise la conexión con el servidor"} accion={<Link to="/tareas/en-ejecucion">Ir a tareas</Link>}>
          {noExiste ? "Puede que se haya eliminado. Sus resultados, si los tenía, siguen en la carpeta resultados." : error?.message}
        </Vacio>
      </Hoja>
    );
  }

  const estado = corriendo ? "en_ejecucion" : tarea.estado;
  const documentos = Object.entries(tarea.documentos);
  const { progreso } = tarea;
  const terminada = estado === "completada" || estado === "completada_con_errores";
  const reanudable = ["detenida", "interrumpida", "completada_con_errores", "error"].includes(estado);
  const enCurso = documentos.filter(([, d]) => d.estado === "en_proceso");

  async function abrirCarpeta() {
    setAbriendo(true);
    try {
      await api.abrirCarpeta(tareaId);
      toast("Se abrió la carpeta de resultados", { description: "Revise el explorador de Windows." });
    } catch (e) {
      toast.error("No se pudo abrir la carpeta", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setAbriendo(false);
    }
  }

  const botonCarpeta = (variante: "principal" | "secundario") => (
    <Boton variante={variante} icono="carpetaAbierta" onClick={() => void abrirCarpeta()} cargando={abriendo}>
      {terminada ? "Consultar reporte" : "Abrir carpeta de resultados"}
    </Boton>
  );

  return (
    <Hoja
      ancha
      titulo={terminada ? "Evaluación final" : nombreTarea(tarea)}
      descripcion={
        <>
          {terminada && <span className="hoja__nombre-tarea">{nombreTarea(tarea)} · </span>}
          <span className="cifra">ID de tarea · {tarea.tarea_id}</span>
        </>
      }
      lateral={<EstadoTareaPastilla estado={estado} deteniendo={activa?.deteniendo} />}
      pie={
        <>
          <p className="hoja__nota">Datos de la tarea · Solo lectura</p>
          <div className="hoja__acciones">
            {corriendo ? (
              <>
                {botonCarpeta("secundario")}
                <Boton icono="detener" disabled={activa?.deteniendo} onClick={() => pedir("detener", tarea)}>
                  {activa?.deteniendo ? "Deteniendo…" : "Detener"}
                </Boton>
              </>
            ) : (
              <>
                <Boton variante="peligro" icono="eliminar" onClick={() => pedir("eliminar", tarea)}>
                  Eliminar
                </Boton>
                {reanudable && (
                  <Boton variante={terminada ? "secundario" : "principal"} icono="reanudar" onClick={() => pedir("reanudar", tarea)}>
                    Reanudar
                  </Boton>
                )}
                {terminada && botonCarpeta("principal")}
              </>
            )}
          </div>
        </>
      }
    >
      <dl className="ficha">
        <div>
          <dt>Creada</dt>
          <dd className="cifra">{fecha(tarea.creada)}</dd>
        </div>
        <div>
          <dt>Finalizada</dt>
          <dd className="cifra">{fecha(tarea.finalizada)}</dd>
        </div>
        <div>
          <dt>Modelo de IA</dt>
          <dd>{tarea.modelo_llm ?? "—"}</dd>
        </div>
        <div>
          <dt>Lectura de PDF</dt>
          <dd>{EXTRACTOR[tarea.extractor] ?? tarea.extractor}</dd>
        </div>
      </dl>

      <div className="resumen-docs">
        <span className="resumen-docs__total">
          <Icono nombre="documentos" tamano={17} />
          <strong className="cifra">{progreso.total} documentos</strong>
        </span>
        <span className="cifra">{progreso.completados} completados</span>
        <span className={`cifra${progreso.errores ? " resumen-docs__errores" : ""}`}>{progreso.errores} errores</span>
        {!terminada && <span className="cifra">{progreso.total - progreso.procesados} por procesar</span>}
      </div>

      {tarea.error && (
        <Aviso tono="error" titulo={estado === "error" ? "La tarea no pudo ejecutarse" : "Hubo un problema al terminar"}>
          {tarea.error}
        </Aviso>
      )}

      {corriendo && (
        <div className="avance" aria-live="polite">
          <div className="avance__cabecera">
            <p className="avance__cifra cifra">{Math.round(progreso.porcentaje)} %</p>
            <p className="avance__texto">
              {activa?.deteniendo
                ? "Deteniendo: se termina la etapa en curso de cada historia clínica."
                : enCurso.length
                  ? enCurso.map(([, d]) => `${d.archivo}: ${ETAPA[d.etapa ?? "en_cola"] ?? d.etapa}`).join(" · ")
                  : "Preparando el siguiente documento…"}
            </p>
          </div>
          <div className="progreso__barra progreso__barra--grande" role="progressbar" aria-valuenow={progreso.porcentaje} aria-valuemin={0} aria-valuemax={100}>
            <motion.span className="progreso__relleno" initial={false} animate={{ scaleX: progreso.porcentaje / 100 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} />
          </div>
          <p className="avance__nota">
            Cada historia clínica tarda entre 30 s y unos minutos (la evaluación con IA hace 53 consultas). Puede seguir usando la
            herramienta mientras tanto.
          </p>
        </div>
      )}

      {terminada && tarea.reporte_general && <EvaluacionFinal tarea={tarea} />}
      {terminada && !tarea.reporte_general && (
        <Aviso tono="aviso" titulo="Esta tarea no tiene reporte">
          Ninguna historia clínica terminó correctamente. Revise los errores de cada una abajo.
        </Aviso>
      )}

      <section className="historias">
        <h2 className="seccion__titulo">Historias clínicas</h2>
        <table className="tabla">
          <thead>
            <tr>
              <th>Archivo</th>
              <th className="tabla__ancho-pista">Etapas</th>
              <th>Estado</th>
              <th className="tabla__numero">Adherencia</th>
              <th className="tabla__numero">Tiempo</th>
            </tr>
          </thead>
          <tbody>
            {documentos.map(([docId, d]) => {
              const total = d.indicador?.indicadores.total;
              const segundos = Object.values(d.tiempos).reduce((s, t) => s + t, 0);
              return (
                <tr key={docId}>
                  <td>
                    <span className="tabla__titulo tabla__archivo">{d.archivo}</span>
                    {d.error ? (
                      <span className="tabla__error">{d.error}</span>
                    ) : (
                      d.indicador?.confiable === false && <span className="tabla__aviso">Resultado no del todo confiable</span>
                    )}
                  </td>
                  <td>
                    <PistaEtapas etapas={tarea.etapas} estado={d.estado} etapa={d.etapa} conEtiqueta={d.estado !== "completado"} />
                  </td>
                  <td>
                    <EstadoDocumentoPastilla estado={d.estado} />
                  </td>
                  <td className="tabla__numero">
                    {total != null ? (
                      <span className="adherencia-celda">
                        <span className="cifra">{calificacion(total)}</span>
                        <NivelPastilla nivel={d.indicador?.niveles.total} />
                      </span>
                    ) : (
                      <span className="tabla__vacio">—</span>
                    )}
                  </td>
                  <td className="tabla__numero cifra tabla__meta-celda">{segundos ? duracion(segundos) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="datos-tarea">
        <h2 className="seccion__titulo">Datos de la tarea</h2>
        <div className="campo">
          <span className="campo__etiqueta">Carpeta del lote de entrada</span>
          <p className="solo-lectura cifra">{tarea.carpeta_entrada}</p>
        </div>
        <div className="campo">
          <span className="campo__etiqueta">Resultados</span>
          <div className="solo-lectura solo-lectura--accion">
            <span className="cifra">{tarea.carpeta_salida}</span>
            <button type="button" className="enlace" onClick={() => void abrirCarpeta()}>
              Abrir carpeta
            </button>
          </div>
          {tarea.reportes.length > 0 && (
            <p className="campo__ayuda">
              Reporte de adherencia:{" "}
              <a href={api.urlReporte(tarea.tarea_id, "xlsx")} download>
                descargar Excel
              </a>{" "}
              ·{" "}
              <a href={api.urlReporte(tarea.tarea_id, "json")} download>
                JSON
              </a>
            </p>
          )}
        </div>
      </section>
      {dialogo}
    </Hoja>
  );
}
