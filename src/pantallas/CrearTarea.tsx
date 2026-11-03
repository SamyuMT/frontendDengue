import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { api, type ListaPdf, type ModelosLocales } from "../api.ts";
import { Boton } from "../componentes/Boton.tsx";
import { Aviso, Hoja } from "../componentes/Hoja.tsx";
import { Icono } from "../componentes/Icono.tsx";
import { SelectorCarpeta } from "../componentes/SelectorCarpeta.tsx";
import { useApp } from "../ContextoApp.tsx";
import { proveedor } from "../datos/formato.ts";

const ULTIMO_MODELO = "adherencia.ultimoModelo";

const EXTRACTORES: Record<string, { titulo: string; detalle: string }> = {
  pymupdf: { titulo: "Rápido", detalle: "PyMuPDF · menos de 1 s por HC" },
  pdfplumber: { titulo: "Detallado", detalle: "pdfplumber · unos 8 s por HC, conserva mejor las tablas" },
};

export function CrearTarea() {
  const { modelos, recargar } = useApp();
  const navegar = useNavigate();
  const idNombre = useId();

  const [nombre, setNombre] = useState("");
  const [carpeta, setCarpeta] = useState("");
  const [lista, setLista] = useState<ListaPdf | null>(null);
  const [modeloLlm, setModeloLlm] = useState(() => localStorage.getItem(ULTIMO_MODELO) ?? "");
  const [locales, setLocales] = useState<ModelosLocales | null>(null);
  const [extractor, setExtractor] = useState("pymupdf");
  const [segmentar, setSegmentar] = useState(true);
  const [embeddings, setEmbeddings] = useState("");
  const [avanzadas, setAvanzadas] = useState(false);
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  useEffect(() => {
    api
      .modelosLocales()
      .then((datos) => {
        setLocales(datos);
        setEmbeddings(datos.embeddings.includes(datos.embeddings_por_defecto) ? datos.embeddings_por_defecto : (datos.embeddings[0] ?? ""));
        if (datos.extractores.length && !datos.extractores.includes("pymupdf")) setExtractor(datos.extractores[0]);
      })
      .catch(() => setLocales(null));
  }, []);

  // Si el último modelo usado ya no existe, elegir el primero con llave lista.
  useEffect(() => {
    if (modelos.length && !modelos.some((m) => m.nombre === modeloLlm)) {
      setModeloLlm((modelos.find((m) => m.api_key_configurada || proveedor(m).local) ?? modelos[0]).nombre);
    }
  }, [modelos, modeloLlm]);

  const errores = {
    nombre: !nombre.trim() ? "Escriba un nombre para reconocer la tarea." : null,
    carpeta: !lista ? "Elija una carpeta con historias clínicas en PDF." : null,
    modelo: !modeloLlm ? "Elija el modelo de IA que evaluará las HC." : null,
    embeddings: locales && !embeddings ? "No hay modelos de embeddings en la carpeta models/." : null,
  };
  const valido = !Object.values(errores).some(Boolean);

  async function crear() {
    setIntentoEnviar(true);
    setErrorServidor(null);
    if (!valido) return;
    setCreando(true);
    try {
      const { tarea_id } = await api.crearTarea({
        nombre: nombre.trim(),
        carpeta_entrada: carpeta,
        extractor,
        segmentar,
        modelo_embeddings: embeddings || locales?.embeddings_por_defecto || "all-MiniLM-L6-v2",
        modelo_llm: modeloLlm,
      });
      localStorage.setItem(ULTIMO_MODELO, modeloLlm);
      await recargar();
      toast.success("Tarea creada", { description: `${lista?.total ?? 0} HC en proceso. Puede seguir el avance aquí.` });
      navegar(`/tareas/${tarea_id}`);
    } catch (e) {
      setErrorServidor(e instanceof Error ? e.message : "No se pudo crear la tarea.");
    } finally {
      setCreando(false);
    }
  }

  const mostrar = (campo: keyof typeof errores) => (intentoEnviar ? errores[campo] : null);

  return (
    <Hoja
      titulo="Crear tarea"
      descripcion="Asigne un nombre a la tarea, elija la carpeta con las historias clínicas y el modelo de IA que las evaluará."
      pie={
        <>
          <p className="hoja__nota">
            <Icono nombre="carpeta" tamano={15} />
            Los resultados se guardan solos en la carpeta <strong>resultados</strong> de la herramienta.
          </p>
          <div className="hoja__acciones">
            <Boton onClick={() => navegar(-1)}>Cancelar</Boton>
            <Boton variante="principal" onClick={() => void crear()} cargando={creando}>
              Crear tarea
            </Boton>
          </div>
        </>
      }
    >
      <form
        className="formulario"
        onSubmit={(e) => {
          e.preventDefault();
          void crear();
        }}
      >
        <div className="campo">
          <label className="campo__etiqueta" htmlFor={idNombre}>
            Nombre de la tarea
          </label>
          <input
            id={idNombre}
            className={`entrada${mostrar("nombre") ? " entrada--error" : ""}`}
            value={nombre}
            maxLength={120}
            placeholder="Ej. Revisión de lote de noviembre"
            onChange={(e) => setNombre(e.target.value)}
            aria-invalid={Boolean(mostrar("nombre")) || undefined}
          />
          {mostrar("nombre") ? (
            <p className="campo__error">{errores.nombre}</p>
          ) : (
            <p className="campo__ayuda">Use un nombre que le permita identificar esta tarea.</p>
          )}
        </div>

        <SelectorCarpeta
          etiqueta="Carpeta del lote de entrada"
          ayuda="La carpeta con las historias clínicas en PDF que se van a evaluar."
          ruta={carpeta}
          onCambio={(ruta, nuevaLista) => {
            setCarpeta(ruta);
            setLista(nuevaLista);
          }}
        />
        {mostrar("carpeta") && !carpeta && <p className="campo__error campo__error--suelto">{errores.carpeta}</p>}

        <fieldset className="campo">
          <legend className="campo__etiqueta">Modelo de IA principal</legend>
          {modelos.length === 0 ? (
            <Aviso tono="aviso" titulo="Todavía no hay modelos de IA vinculados">
              La persona técnica que configura la herramienta debe vincular al menos uno en{" "}
              <Link to="/modelos">Modelos de IA</Link>.
            </Aviso>
          ) : (
            <>
              <div className="opciones-modelo" role="radiogroup">
                {modelos.map((m) => {
                  const p = proveedor(m);
                  const listo = m.api_key_configurada || p.local || !m.api_key_env;
                  return (
                    <label key={m.nombre} className={`opcion-modelo${modeloLlm === m.nombre ? " opcion-modelo--elegida" : ""}`}>
                      <input
                        type="radio"
                        name="modelo"
                        value={m.nombre}
                        checked={modeloLlm === m.nombre}
                        onChange={() => setModeloLlm(m.nombre)}
                        className="solo-lector"
                      />
                      <span className="opcion-modelo__radio" aria-hidden>
                        {modeloLlm === m.nombre && <motion.span layoutId="radio-modelo" className="opcion-modelo__punto" />}
                      </span>
                      <span className="opcion-modelo__texto">
                        <span className="opcion-modelo__nombre">{m.nombre}</span>
                        <span className="opcion-modelo__meta">
                          <Icono nombre={p.local ? "equipo" : "nube"} tamano={14} />
                          {p.nombre} · {m.modelo}
                        </span>
                      </span>
                      {!listo && <span className="pastilla pastilla--aviso">Sin llave</span>}
                    </label>
                  );
                })}
              </div>
              <p className="campo__ayuda">
                Si este modelo falla, la herramienta intenta con los demás vinculados, en orden.
              </p>
            </>
          )}
          {mostrar("modelo") && modelos.length > 0 && <p className="campo__error">{errores.modelo}</p>}
        </fieldset>

        <div className="avanzadas">
          <button
            type="button"
            className="avanzadas__boton"
            aria-expanded={avanzadas}
            onClick={() => setAvanzadas((v) => !v)}
          >
            <Icono nombre="ajustes" tamano={17} />
            Opciones avanzadas
            <span className="avanzadas__resumen">
              {EXTRACTORES[extractor]?.titulo ?? extractor} · {segmentar ? "por oraciones" : "por líneas"} · {embeddings || "—"}
            </span>
            <motion.span animate={{ rotate: avanzadas ? 180 : 0 }} transition={{ duration: 0.2 }} className="avanzadas__flecha">
              <Icono nombre="abajo" tamano={16} />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {avanzadas && (
              <motion.div
                className="avanzadas__cuerpo"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="avanzadas__rejilla">
                  <fieldset className="campo">
                    <legend className="campo__etiqueta">Lectura de los PDF</legend>
                    <div className="segmentado">
                      {(locales?.extractores ?? ["pymupdf", "pdfplumber"]).map((clave) => (
                        <label key={clave} className={`segmentado__opcion${extractor === clave ? " segmentado__opcion--activa" : ""}`}>
                          <input type="radio" className="solo-lector" checked={extractor === clave} onChange={() => setExtractor(clave)} />
                          {EXTRACTORES[clave]?.titulo ?? clave}
                        </label>
                      ))}
                    </div>
                    <p className="campo__ayuda">{EXTRACTORES[extractor]?.detalle ?? extractor}</p>
                  </fieldset>

                  <fieldset className="campo">
                    <legend className="campo__etiqueta">Separar el texto</legend>
                    <div className="segmentado">
                      {[
                        { valor: true, texto: "Por oraciones" },
                        { valor: false, texto: "Por líneas" },
                      ].map((o) => (
                        <label key={o.texto} className={`segmentado__opcion${segmentar === o.valor ? " segmentado__opcion--activa" : ""}`}>
                          <input type="radio" className="solo-lector" checked={segmentar === o.valor} onChange={() => setSegmentar(o.valor)} />
                          {o.texto}
                        </label>
                      ))}
                    </div>
                    <p className="campo__ayuda">Cómo se divide la HC antes de buscar las secciones de la guía.</p>
                  </fieldset>

                  <div className="campo">
                    <label className="campo__etiqueta" htmlFor="embeddings">
                      Modelo de búsqueda (embeddings)
                    </label>
                    <select id="embeddings" className="entrada" value={embeddings} onChange={(e) => setEmbeddings(e.target.value)}>
                      {(locales?.embeddings ?? []).map((m) => (
                        <option key={m} value={m}>
                          {m}
                          {m === locales?.embeddings_por_defecto ? " (recomendado)" : ""}
                        </option>
                      ))}
                    </select>
                    <p className="campo__ayuda">Modelos locales de la carpeta models/. Se agregan copiándolos allí.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {mostrar("embeddings") && <p className="campo__error">{errores.embeddings}</p>}
        </div>

        {errorServidor && (
          <Aviso tono="error" titulo="No se pudo crear la tarea">
            {errorServidor}
          </Aviso>
        )}
        <button type="submit" hidden />
      </form>
    </Hoja>
  );
}
