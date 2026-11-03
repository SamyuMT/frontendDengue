import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { api, type ModeloLLM } from "../api.ts";
import { Boton } from "../componentes/Boton.tsx";
import { Dialogo } from "../componentes/Dialogo.tsx";
import { Aviso, Hoja, Vacio } from "../componentes/Hoja.tsx";
import { Icono } from "../componentes/Icono.tsx";
import { useApp } from "../ContextoApp.tsx";
import { proveedor } from "../datos/formato.ts";

interface Plantilla {
  id: string;
  nombre: string;
  local: boolean;
  alias: string;
  modelo: string;
  base_url: string;
  api_key_env: string;
  ayuda: string;
}

const PLANTILLAS: Plantilla[] = [
  { id: "openai", nombre: "OpenAI", local: false, alias: "gpt4o-mini", modelo: "gpt-4o-mini", base_url: "", api_key_env: "OPENAI_API_KEY", ayuda: "Llave en platform.openai.com → API keys." },
  { id: "deepseek", nombre: "DeepSeek", local: false, alias: "deepseek", modelo: "deepseek-chat", base_url: "https://api.deepseek.com", api_key_env: "DEEPSEEK_API_KEY", ayuda: "Llave en platform.deepseek.com." },
  { id: "gemini", nombre: "Google Gemini", local: false, alias: "gemini-flash", modelo: "gemini-2.0-flash", base_url: "https://generativelanguage.googleapis.com/v1beta/openai/", api_key_env: "GEMINI_API_KEY", ayuda: "Llave en aistudio.google.com." },
  { id: "anthropic", nombre: "Anthropic", local: false, alias: "claude", modelo: "claude-sonnet-5-5", base_url: "https://api.anthropic.com/v1/", api_key_env: "ANTHROPIC_API_KEY", ayuda: "Llave en console.anthropic.com." },
  { id: "ollama", nombre: "Ollama", local: true, alias: "ollama-llama", modelo: "llama3.1", base_url: "http://localhost:11434/v1", api_key_env: "", ayuda: "Ollama debe estar abierto y con el modelo descargado (ollama pull …)." },
  { id: "lmstudio", nombre: "LM Studio", local: true, alias: "lmstudio", modelo: "", base_url: "http://localhost:1234/v1", api_key_env: "", ayuda: "Encienda el servidor local en LM Studio y copie el identificador del modelo cargado." },
  { id: "otro", nombre: "Otro compatible", local: false, alias: "", modelo: "", base_url: "", api_key_env: "", ayuda: "Cualquier servicio compatible con la API de OpenAI." },
];

const NOMBRE_VALIDO = /^[\w.-]+$/;

interface Formulario {
  nombre: string;
  modelo: string;
  base_url: string;
  api_key_env: string;
  api_key: string;
  timeout_s: number;
}

const vacio = (p: Plantilla): Formulario => ({
  nombre: p.alias,
  modelo: p.modelo,
  base_url: p.base_url,
  api_key_env: p.api_key_env,
  api_key: "",
  timeout_s: p.local ? 120 : 60,
});

type Prueba = { estado: "probando" } | { estado: "ok"; segundos: number; respuesta: string } | { estado: "error"; mensaje: string };

export function ModelosIA() {
  const { modelos, recargar } = useApp();
  const [abierto, setAbierto] = useState(modelos.length === 0);
  const [plantilla, setPlantilla] = useState<Plantilla>(PLANTILLAS[1]);
  const [form, setForm] = useState<Formulario>(vacio(PLANTILLAS[1]));
  const [editando, setEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [intento, setIntento] = useState(false);
  const [pruebas, setPruebas] = useState<Record<string, Prueba>>({});
  const [porEliminar, setPorEliminar] = useState<ModeloLLM | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const usaLlave = !plantilla.local && plantilla.id !== "otro" ? true : Boolean(form.api_key_env);
  const errores = {
    nombre: !form.nombre ? "Escriba un nombre corto." : !NOMBRE_VALIDO.test(form.nombre) ? "Solo letras, números, guiones y puntos, sin espacios." : null,
    modelo: !form.modelo.trim() ? "Escriba el identificador del modelo." : null,
    base_url: plantilla.id !== "openai" && !form.base_url.trim() ? "Escriba la URL del servicio." : null,
    api_key_env: form.api_key && !form.api_key_env ? "Indique en qué variable guardar la llave." : null,
  };
  const valido = !Object.values(errores).some(Boolean);
  const error = (campo: keyof typeof errores) => (intento ? errores[campo] : null);

  function elegirPlantilla(p: Plantilla) {
    setPlantilla(p);
    setForm(vacio(p));
    setEditando(null);
    setIntento(false);
  }

  function editar(m: ModeloLLM) {
    const p = proveedor(m);
    setPlantilla(PLANTILLAS.find((x) => x.nombre === p.nombre) ?? PLANTILLAS[PLANTILLAS.length - 1]);
    setForm({ nombre: m.nombre, modelo: m.modelo, base_url: m.base_url ?? "", api_key_env: m.api_key_env ?? "", api_key: "", timeout_s: m.timeout_s });
    setEditando(m.nombre);
    setAbierto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function guardar() {
    setIntento(true);
    if (!valido) return;
    setGuardando(true);
    try {
      await api.vincularModelo({
        nombre: form.nombre,
        modelo: form.modelo.trim(),
        base_url: form.base_url.trim() || null,
        api_key_env: form.api_key_env.trim() || null,
        api_key: form.api_key.trim() || null,
        timeout_s: form.timeout_s,
      });
      await recargar();
      toast.success(editando ? "Modelo actualizado" : "Modelo vinculado", { description: "Pruébelo para confirmar que responde." });
      setAbierto(false);
      setEditando(null);
      setIntento(false);
      setForm(vacio(plantilla));
    } catch (e) {
      toast.error("No se pudo guardar el modelo", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setGuardando(false);
    }
  }

  async function probar(m: ModeloLLM) {
    setPruebas((p) => ({ ...p, [m.nombre]: { estado: "probando" } }));
    try {
      const r = await api.probarModelo(m.nombre);
      setPruebas((p) => ({ ...p, [m.nombre]: { estado: "ok", segundos: r.tiempo_segundos, respuesta: r.respuesta } }));
    } catch (e) {
      setPruebas((p) => ({ ...p, [m.nombre]: { estado: "error", mensaje: e instanceof Error ? e.message : "No respondió." } }));
    }
  }

  async function eliminar() {
    if (!porEliminar) return;
    setEliminando(true);
    try {
      await api.desvincularModelo(porEliminar.nombre);
      await recargar();
      toast.success("Modelo desvinculado");
      setPorEliminar(null);
    } catch (e) {
      toast.error("No se pudo desvincular", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setEliminando(false);
    }
  }

  const cambiar = (campo: keyof Formulario) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: campo === "timeout_s" ? Number(e.target.value) : e.target.value }));

  return (
    <Hoja
      ancha
      titulo="Modelos de IA"
      descripcion="Los modelos que evalúan las historias clínicas. Normalmente los deja listos la persona técnica una sola vez; el auditor solo elige uno al crear la tarea."
      lateral={
        !abierto && (
          <Boton variante="principal" icono="mas" onClick={() => setAbierto(true)}>
            Vincular modelo
          </Boton>
        )
      }
    >
      <AnimatePresence initial={false} mode="popLayout">
        {abierto && (
          <motion.section
            className="panel-vincular"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="panel-vincular__interior">
              <div className="panel-vincular__cabecera">
                <h2 className="seccion__titulo">{editando ? `Editar «${editando}»` : "Vincular un modelo"}</h2>
                <button type="button" className="icono-boton" aria-label="Cerrar" onClick={() => setAbierto(false)}>
                  <Icono nombre="cerrar" tamano={18} />
                </button>
              </div>

              {!editando && (
                <div className="plantillas" role="radiogroup" aria-label="Proveedor">
                  {PLANTILLAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={plantilla.id === p.id}
                      className={`plantilla${plantilla.id === p.id ? " plantilla--elegida" : ""}`}
                      onClick={() => elegirPlantilla(p)}
                    >
                      <Icono nombre={p.local ? "equipo" : "nube"} tamano={16} />
                      <span className="plantilla__nombre">{p.nombre}</span>
                      <span className="plantilla__tipo">{p.local ? "En este equipo" : p.id === "otro" ? "Personalizado" : "En internet"}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="campo__ayuda">{plantilla.ayuda}</p>
              {!plantilla.local && (
                <p className="panel-vincular__etica">
                  <Icono nombre="info" tamano={15} />
                  Con un proveedor en internet, el texto de las HC (ya anonimizado) sale del equipo hacia ese servicio.
                </p>
              )}

              <form
                className="rejilla-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void guardar();
                }}
              >
                <Campo etiqueta="Nombre en la herramienta" ayuda="Así aparecerá en la lista al crear una tarea." error={error("nombre")}>
                  <input className="entrada" value={form.nombre} onChange={cambiar("nombre")} disabled={Boolean(editando)} placeholder="deepseek" spellCheck={false} />
                </Campo>
                <Campo etiqueta="Identificador del modelo" ayuda="El nombre exacto que usa el proveedor." error={error("modelo")}>
                  <input className="entrada" value={form.modelo} onChange={cambiar("modelo")} placeholder="deepseek-chat" spellCheck={false} />
                </Campo>
                <Campo etiqueta="URL del servicio" ayuda={plantilla.id === "openai" ? "Vacía = OpenAI." : "Debe terminar donde empieza /chat/completions."} error={error("base_url")} ancho>
                  <input className="entrada cifra" value={form.base_url} onChange={cambiar("base_url")} placeholder="https://…" spellCheck={false} />
                </Campo>
                {usaLlave && (
                  <>
                    <Campo etiqueta="Variable de la llave" ayuda="Nombre con el que se guarda en el archivo .env." error={error("api_key_env")}>
                      <input className="entrada cifra" value={form.api_key_env} onChange={cambiar("api_key_env")} placeholder="DEEPSEEK_API_KEY" spellCheck={false} />
                    </Campo>
                    <Campo etiqueta="Llave de API" ayuda={editando ? "Déjela vacía para conservar la actual." : "Se guarda solo en el .env de este equipo; nunca se vuelve a mostrar."}>
                      <input className="entrada" type="password" autoComplete="off" value={form.api_key} onChange={cambiar("api_key")} placeholder="sk-…" />
                    </Campo>
                  </>
                )}
                <Campo etiqueta="Tiempo máximo de respuesta" ayuda="Segundos antes de intentar con otro modelo.">
                  <input className="entrada cifra" type="number" min={5} max={600} value={form.timeout_s} onChange={cambiar("timeout_s")} />
                </Campo>
                <div className="rejilla-form__acciones">
                  <Boton onClick={() => setAbierto(false)}>Cancelar</Boton>
                  <Boton variante="principal" type="submit" cargando={guardando}>
                    {editando ? "Guardar cambios" : "Vincular modelo"}
                  </Boton>
                </div>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {modelos.length === 0 ? (
        !abierto && (
          <Vacio titulo="No hay modelos vinculados" accion={<Boton variante="principal" icono="mas" onClick={() => setAbierto(true)}>Vincular modelo</Boton>}>
            Sin al menos un modelo no se pueden evaluar historias clínicas.
          </Vacio>
        )
      ) : (
        <>
          <table className="tabla">
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Proveedor</th>
                <th>Llave</th>
                <th>Prueba</th>
                <th className="tabla__acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {modelos.map((m) => {
                const p = proveedor(m);
                const prueba = pruebas[m.nombre];
                return (
                  <tr key={m.nombre}>
                    <td>
                      <span className="tabla__titulo">{m.nombre}</span>
                      <span className="tabla__meta cifra">{m.modelo}</span>
                    </td>
                    <td>
                      <span className="proveedor">
                        <Icono nombre={p.local ? "equipo" : "nube"} tamano={15} />
                        {p.nombre}
                      </span>
                      <span className="tabla__meta">{p.local ? "En este equipo" : "En internet"}</span>
                    </td>
                    <td>
                      {!m.api_key_env ? (
                        <span className="tabla__meta-celda">No necesita</span>
                      ) : m.api_key_configurada ? (
                        <span className="pastilla pastilla--neutro">
                          <Icono nombre="llave" tamano={13} /> Configurada
                        </span>
                      ) : (
                        <span className="pastilla pastilla--aviso">Falta la llave</span>
                      )}
                    </td>
                    <td className="tabla__prueba" aria-live="polite">
                      {!prueba && <span className="tabla__vacio">Sin probar</span>}
                      {prueba?.estado === "probando" && <span className="tabla__meta-celda">Consultando…</span>}
                      {prueba?.estado === "ok" && (
                        <span className="prueba prueba--ok">
                          <Icono nombre="check" tamano={15} /> Respondió en <span className="cifra">{prueba.segundos.toLocaleString("es-CO", { maximumFractionDigits: 1 })} s</span>
                        </span>
                      )}
                      {prueba?.estado === "error" && (
                        <span className="prueba prueba--error" title={prueba.mensaje}>
                          <Icono nombre="alerta" tamano={15} /> No respondió
                        </span>
                      )}
                    </td>
                    <td className="tabla__acciones">
                      <button type="button" className="enlace" disabled={prueba?.estado === "probando"} onClick={() => void probar(m)}>
                        Probar
                      </button>
                      <button type="button" className="enlace" onClick={() => editar(m)}>
                        Editar
                      </button>
                      <button type="button" className="enlace enlace--peligro" onClick={() => setPorEliminar(m)}>
                        Quitar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {Object.values(pruebas).some((p) => p.estado === "error") && (
            <Aviso tono="error" titulo="Algún modelo no respondió">
              {Object.entries(pruebas)
                .filter(([, p]) => p.estado === "error")
                .map(([nombre, p]) => (
                  <p key={nombre}>
                    <strong>{nombre}:</strong> {p.estado === "error" && p.mensaje}
                  </p>
                ))}
            </Aviso>
          )}
          <p className="tabla__pie">
            <span>«Probar» hace una consulta real de pocos tokens.</span>
            <span>Al evaluar, si el modelo principal falla, se usan los demás en este orden.</span>
          </p>
        </>
      )}

      <Dialogo
        abierto={porEliminar !== null}
        titulo="¿Quitar este modelo?"
        icono="eliminar"
        tono="peligro"
        textoConfirmar="Quitar modelo"
        confirmando={eliminando}
        onConfirmar={() => void eliminar()}
        onCerrar={() => setPorEliminar(null)}
      >
        <p>
          «{porEliminar?.nombre}» dejará de estar disponible para nuevas tareas. La llave sigue guardada en el .env por si lo vuelve a
          vincular.
        </p>
      </Dialogo>
    </Hoja>
  );
}

function Campo({ etiqueta, ayuda, error, ancho, children }: { etiqueta: string; ayuda?: string; error?: string | null; ancho?: boolean; children: React.ReactNode }) {
  return (
    <label className={`campo${ancho ? " campo--ancho" : ""}`}>
      <span className="campo__etiqueta">{etiqueta}</span>
      {children}
      {error ? <span className="campo__error">{error}</span> : ayuda && <span className="campo__ayuda">{ayuda}</span>}
    </label>
  );
}
