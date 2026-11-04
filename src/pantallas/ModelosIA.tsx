import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api, type ModeloDisponible, type ModeloLLM, type Proveedor } from "../api.ts";
import { Boton } from "../componentes/Boton.tsx";
import { Dialogo } from "../componentes/Dialogo.tsx";
import { Aviso, Hoja, Vacio } from "../componentes/Hoja.tsx";
import { Icono } from "../componentes/Icono.tsx";
import { useApp } from "../ContextoApp.tsx";
import { proveedor as proveedorDe } from "../datos/formato.ts";

const AYUDA_LLAVE: Record<string, string> = {
  openai: "Se crea en platform.openai.com → API keys.",
  deepseek: "Se crea en platform.deepseek.com → API keys.",
  anthropic: "Se crea en console.anthropic.com → API keys.",
};

// Sugeridos arriba de la lista (si la llave los tiene disponibles)
const SUGERIDOS: Record<string, string[]> = {
  openai: ["gpt-6-astra", "gpt-6.1-sol", "gpt-5.4-mini", "gpt-4o-mini"],
  deepseek: ["deepseek-chat"],
  anthropic: ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
};

type Prueba = { estado: "probando" } | { estado: "ok"; segundos: number } | { estado: "error"; mensaje: string };

export function ModelosIA() {
  const { modelos, recargar } = useApp();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [abierto, setAbierto] = useState(modelos.length === 0);
  const [elegido, setElegido] = useState<Proveedor | null>(null);
  const [pruebas, setPruebas] = useState<Record<string, Prueba>>({});
  const [porEliminar, setPorEliminar] = useState<ModeloLLM | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarProveedores = () =>
    api
      .proveedores()
      .then((lista) => {
        setProveedores(lista);
        setElegido((actual) => (actual ? (lista.find((p) => p.id === actual.id) ?? null) : (lista.find((p) => p.habilitado) ?? null)));
      })
      .catch(() => setProveedores([]));

  useEffect(() => {
    void cargarProveedores();
  }, []);

  async function probar(m: ModeloLLM) {
    setPruebas((p) => ({ ...p, [m.nombre]: { estado: "probando" } }));
    try {
      const r = await api.probarModelo(m.nombre);
      setPruebas((p) => ({ ...p, [m.nombre]: { estado: "ok", segundos: r.tiempo_segundos } }));
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

  return (
    <Hoja
      ancha
      titulo="Modelos de IA"
      descripcion="Los modelos que evalúan las historias clínicas. Normalmente los deja listos la persona técnica una sola vez; el auditor solo elige uno al crear la tarea."
      lateral={
        !abierto && (
          <Boton variante="principal" icono="mas" onClick={() => setAbierto(true)}>
            Vincular modelos
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
                <h2 className="seccion__titulo">Vincular modelos de un proveedor</h2>
                <button type="button" className="icono-boton" aria-label="Cerrar" onClick={() => setAbierto(false)}>
                  <Icono nombre="cerrar" tamano={18} />
                </button>
              </div>

              <div className="plantillas" role="radiogroup" aria-label="Proveedor">
                {proveedores.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={elegido?.id === p.id}
                    disabled={!p.habilitado}
                    className={`plantilla${elegido?.id === p.id ? " plantilla--elegida" : ""}`}
                    onClick={() => setElegido(p)}
                  >
                    <Icono nombre={p.base_url?.includes("localhost") ? "equipo" : "nube"} tamano={16} />
                    <span className="plantilla__nombre">{p.nombre}</span>
                    <span className="plantilla__tipo">
                      {!p.habilitado ? "Próximamente" : p.api_key_configurada ? "Llave guardada" : "En internet"}
                    </span>
                  </button>
                ))}
              </div>

              {elegido && (
                <FormProveedor
                  key={elegido.id}
                  proveedor={elegido}
                  vinculados={modelos}
                  onVinculados={async (cantidad) => {
                    await Promise.all([recargar(), cargarProveedores()]);
                    toast.success(cantidad === 1 ? "Modelo vinculado" : `${cantidad} modelos vinculados`, {
                      description: "Use «Probar» para confirmar que responden.",
                    });
                  }}
                />
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {modelos.length === 0 ? (
        !abierto && (
          <Vacio
            titulo="No hay modelos vinculados"
            accion={
              <Boton variante="principal" icono="mas" onClick={() => setAbierto(true)}>
                Vincular modelos
              </Boton>
            }
          >
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
                const p = proveedorDe(m);
                const prueba = pruebas[m.nombre];
                return (
                  <tr key={m.nombre}>
                    <td>
                      <span className="tabla__titulo">{m.nombre}</span>
                      {m.modelo !== m.nombre && <span className="tabla__meta cifra">{m.modelo}</span>}
                    </td>
                    <td>
                      <span className="proveedor">
                        <Icono nombre={p.local ? "equipo" : "nube"} tamano={15} />
                        {p.nombre}
                      </span>
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
                          <Icono nombre="check" tamano={15} /> Respondió en{" "}
                          <span className="cifra">{prueba.segundos.toLocaleString("es-CO", { maximumFractionDigits: 1 })} s</span>
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
          «{porEliminar?.nombre}» dejará de estar disponible para nuevas tareas. La llave del proveedor sigue guardada en el .env
          para sus otros modelos.
        </p>
      </Dialogo>
    </Hoja>
  );
}

/** Llave → consultar modelos disponibles → marcar uno o varios → vincular con la misma llave. */
function FormProveedor({
  proveedor,
  vinculados,
  onVinculados,
}: {
  proveedor: Proveedor;
  vinculados: ModeloLLM[];
  onVinculados: (cantidad: number) => Promise<void>;
}) {
  const [cambiarLlave, setCambiarLlave] = useState(!proveedor.api_key_configurada);
  const [llave, setLlave] = useState("");
  const [baseUrl, setBaseUrl] = useState(proveedor.base_url ?? "");
  const [avanzado, setAvanzado] = useState(false);
  const [disponibles, setDisponibles] = useState<ModeloDisponible[] | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [vinculando, setVinculando] = useState(false);

  const yaVinculados = useMemo(
    () => new Set(vinculados.filter((m) => m.proveedor === proveedor.id || proveedorDe(m).nombre === proveedor.nombre).map((m) => m.modelo)),
    [vinculados, proveedor],
  );

  const usarGuardada = proveedor.api_key_configurada && !cambiarLlave;
  const puedeConsultar = usarGuardada || llave.trim().length > 0;

  async function consultar() {
    setConsultando(true);
    setError(null);
    setDisponibles(null);
    setMarcados(new Set());
    try {
      const lista = await api.modelosDisponibles(proveedor.id, usarGuardada ? undefined : llave.trim(), baseUrl.trim() || undefined);
      const orden = SUGERIDOS[proveedor.id] ?? [];
      lista.sort((a, b) => {
        const ia = orden.indexOf(a.id);
        const ib = orden.indexOf(b.id);
        if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        return b.id.localeCompare(a.id); // Lo más nuevo primero (ids con versión mayor)
      });
      setDisponibles(lista);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo consultar el proveedor.");
    } finally {
      setConsultando(false);
    }
  }

  async function vincular() {
    if (marcados.size === 0) return;
    setVinculando(true);
    setError(null);
    try {
      const creados = await api.vincularVarios(proveedor.id, {
        modelos: [...marcados],
        api_key: usarGuardada ? null : llave.trim(),
        base_url: baseUrl.trim() && baseUrl.trim() !== (proveedor.base_url ?? "") ? baseUrl.trim() : null,
        timeout_s: 60,
      });
      setMarcados(new Set());
      setLlave("");
      setCambiarLlave(false);
      await onVinculados(creados.length);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron vincular.");
    } finally {
      setVinculando(false);
    }
  }

  const visibles = (disponibles ?? []).filter((m) => `${m.id} ${m.nombre}`.toLowerCase().includes(filtro.trim().toLowerCase()));
  const alternar = (id: string) =>
    setMarcados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });

  return (
    <div className="form-proveedor">
      <p className="panel-vincular__etica">
        <Icono nombre="info" tamano={15} />
        El texto de las HC (ya anonimizado) sale del equipo hacia {proveedor.nombre}. Una sola llave sirve para todos sus modelos.
      </p>

      <div className="campo">
        <span className="campo__etiqueta">Llave de API de {proveedor.nombre}</span>
        {usarGuardada ? (
          <div className="solo-lectura solo-lectura--accion">
            <span>
              <Icono nombre="llave" tamano={15} /> Hay una llave guardada en el .env ({proveedor.api_key_env})
            </span>
            <button type="button" className="enlace" onClick={() => setCambiarLlave(true)}>
              Usar otra llave
            </button>
          </div>
        ) : (
          <>
            <div className="carpeta">
              <input
                className="entrada"
                type="password"
                autoComplete="off"
                value={llave}
                placeholder={proveedor.id === "anthropic" ? "sk-ant-…" : "sk-…"}
                onChange={(e) => setLlave(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && puedeConsultar) void consultar();
                }}
              />
              {proveedor.api_key_configurada && (
                <Boton onClick={() => setCambiarLlave(false)}>Usar la guardada</Boton>
              )}
            </div>
            <span className="campo__ayuda">
              {AYUDA_LLAVE[proveedor.id]} Se guarda solo en el .env de este equipo y nunca se vuelve a mostrar.
            </span>
          </>
        )}
      </div>

      <button type="button" className="enlace form-proveedor__avanzado" aria-expanded={avanzado} onClick={() => setAvanzado((v) => !v)}>
        {avanzado ? "Ocultar URL del servicio" : "Cambiar URL del servicio (avanzado)"}
      </button>
      {avanzado && (
        <label className="campo">
          <span className="campo__etiqueta">URL del servicio</span>
          <input className="entrada cifra" value={baseUrl} placeholder="Vacía = la oficial del proveedor" onChange={(e) => setBaseUrl(e.target.value)} spellCheck={false} />
          <span className="campo__ayuda">Solo si usa un proxy o una región distinta. Vacía = la oficial.</span>
        </label>
      )}

      <div>
        <Boton variante={disponibles ? "secundario" : "principal"} icono="tarea" onClick={() => void consultar()} disabled={!puedeConsultar} cargando={consultando}>
          {disponibles ? "Volver a consultar" : "Consultar modelos disponibles"}
        </Boton>
      </div>

      {error && (
        <Aviso tono="error" titulo="No se pudo completar">
          {error}
        </Aviso>
      )}

      {disponibles && (
        <div className="disponibles">
          <div className="disponibles__cabecera">
            <p>
              <strong className="cifra">{disponibles.length}</strong> modelos disponibles con esta llave · marque los que quiera usar
            </p>
            <input className="entrada disponibles__filtro" value={filtro} placeholder="Filtrar, p. ej. gpt-6" onChange={(e) => setFiltro(e.target.value)} />
          </div>
          <ul className="disponibles__lista">
            {visibles.map((m) => {
              const ya = yaVinculados.has(m.id);
              const marcado = marcados.has(m.id);
              return (
                <li key={m.id}>
                  <label className={`disponible${marcado ? " disponible--marcado" : ""}${ya ? " disponible--vinculado" : ""}`}>
                    <input type="checkbox" checked={marcado || ya} disabled={ya} onChange={() => alternar(m.id)} />
                    <span className="disponible__texto">
                      <span className="disponible__id cifra">{m.id}</span>
                      {m.nombre !== m.id && <span className="disponible__nombre">{m.nombre}</span>}
                    </span>
                    {ya ? (
                      <span className="pastilla pastilla--neutro">Vinculado</span>
                    ) : (
                      (SUGERIDOS[proveedor.id] ?? []).includes(m.id) && <span className="pastilla pastilla--activo">Sugerido</span>
                    )}
                  </label>
                </li>
              );
            })}
            {visibles.length === 0 && <li className="disponibles__vacio">Ningún modelo coincide con «{filtro}».</li>}
          </ul>
          <div className="rejilla-form__acciones">
            <Boton variante="principal" icono="mas" disabled={marcados.size === 0} cargando={vinculando} onClick={() => void vincular()}>
              {marcados.size <= 1 ? "Vincular modelo" : `Vincular ${marcados.size} modelos`}
            </Boton>
          </div>
        </div>
      )}
    </div>
  );
}
