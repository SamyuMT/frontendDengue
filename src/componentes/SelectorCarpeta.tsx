import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { api, ErrorApi, type ListaPdf } from "../api.ts";
import { tamano } from "../datos/formato.ts";
import { Boton } from "./Boton.tsx";
import { Icono } from "./Icono.tsx";

type Estado =
  | { tipo: "vacio" }
  | { tipo: "eligiendo" }
  | { tipo: "contando" }
  | { tipo: "ok"; lista: ListaPdf }
  | { tipo: "error"; mensaje: string };

interface Props {
  etiqueta: string;
  ayuda: string;
  ruta: string;
  onCambio: (ruta: string, lista: ListaPdf | null) => void;
}

const MAX_VISTOS = 4;

/**
 * Carpeta de entrada: «Elegir carpeta…» abre el diálogo nativo del sistema (lo abre el servidor,
 * que corre en este mismo equipo) y la ruta elegida se copia al campo. Luego se cuentan los PDF con
 * /v1/documents/list. También se puede pegar la ruta a mano.
 */
export function SelectorCarpeta({ etiqueta, ayuda, ruta, onCambio }: Props) {
  const [estado, setEstado] = useState<Estado>({ tipo: "vacio" });
  const [verTodos, setVerTodos] = useState(false);
  const ultimaValidada = useRef("");
  const idCampo = useId();
  const idAyuda = useId();

  async function validar(nuevaRuta: string) {
    const limpia = nuevaRuta.trim().replace(/^"(.*)"$/, "$1"); // «Copiar como ruta» de Windows agrega comillas
    if (!limpia) {
      setEstado({ tipo: "vacio" });
      onCambio("", null);
      return;
    }
    if (limpia === ultimaValidada.current && estado.tipo === "ok") return;
    ultimaValidada.current = limpia;
    setEstado({ tipo: "contando" });
    setVerTodos(false);
    try {
      const lista = await api.listarPdf(limpia);
      if (lista.total === 0) {
        setEstado({ tipo: "error", mensaje: "La carpeta existe, pero no tiene archivos PDF. Elija la carpeta donde están las historias clínicas." });
        onCambio(limpia, null);
        return;
      }
      setEstado({ tipo: "ok", lista });
      onCambio(limpia, lista);
    } catch (e) {
      const mensaje =
        e instanceof ErrorApi && e.estado === 400
          ? "No se encontró esa carpeta. Revise la ruta o use «Elegir carpeta…»."
          : e instanceof Error
            ? e.message
            : "No se pudo revisar la carpeta.";
      setEstado({ tipo: "error", mensaje });
      onCambio(limpia, null);
    }
  }

  async function elegir() {
    setEstado({ tipo: "eligiendo" });
    try {
      const { ruta: elegida } = await api.elegirCarpeta(ruta || undefined);
      if (!elegida) {
        // Canceló: volver a como estaba
        if (ruta) await validar(ruta);
        else setEstado({ tipo: "vacio" });
        return;
      }
      onCambio(elegida, null);
      await validar(elegida);
    } catch (e) {
      setEstado({ tipo: "error", mensaje: e instanceof Error ? e.message : "No se pudo abrir el explorador." });
    }
  }

  const archivos = estado.tipo === "ok" ? estado.lista.files : [];
  const pesoTotal = archivos.reduce((suma, a) => suma + a.size_bytes, 0);
  const visibles = verTodos ? archivos : archivos.slice(0, MAX_VISTOS);

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={idCampo}>
        {etiqueta}
      </label>
      <div className="carpeta">
        <div className={`carpeta__entrada${estado.tipo === "error" ? " carpeta__entrada--error" : ""}`}>
          <Icono nombre="carpeta" tamano={18} className="carpeta__icono" />
          <input
            id={idCampo}
            className="carpeta__ruta"
            value={ruta}
            placeholder="Elija la carpeta o pegue su ruta, p. ej. D:\Auditoria\Lote noviembre"
            spellCheck={false}
            aria-describedby={idAyuda}
            aria-invalid={estado.tipo === "error" || undefined}
            onChange={(e) => onCambio(e.target.value, null)}
            onBlur={(e) => void validar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void validar(ruta);
              }
            }}
          />
        </div>
        <Boton icono="carpetaAbierta" onClick={() => void elegir()} cargando={estado.tipo === "eligiendo"}>
          Elegir carpeta…
        </Boton>
      </div>

      <div id={idAyuda} aria-live="polite">
        {estado.tipo === "eligiendo" && (
          <p className="campo__ayuda">Se abrió el explorador de Windows. Seleccione la carpeta y pulse «Seleccionar carpeta».</p>
        )}
        {estado.tipo === "contando" && <p className="campo__ayuda">Buscando historias clínicas en PDF…</p>}
        {estado.tipo === "vacio" && <p className="campo__ayuda">{ayuda}</p>}
        {estado.tipo === "error" && (
          <p className="campo__error">
            <Icono nombre="alerta" tamano={15} /> {estado.mensaje}
          </p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {estado.tipo === "ok" && (
          <motion.div
            className="carpeta__resultado"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="carpeta__resumen">
              <Icono nombre="documentos" tamano={18} />
              <strong className="cifra">
                {estado.lista.total} {estado.lista.total === 1 ? "historia clínica" : "historias clínicas"}
              </strong>
              <span className="carpeta__peso">en PDF · {tamano(pesoTotal)}</span>
            </div>
            <ul className="carpeta__lista">
              {visibles.map((archivo) => (
                <li key={archivo.path}>
                  <span className="carpeta__archivo">{archivo.name}</span>
                  <span className="cifra carpeta__tamano">{tamano(archivo.size_bytes)}</span>
                </li>
              ))}
            </ul>
            {archivos.length > MAX_VISTOS && (
              <button type="button" className="carpeta__ver-mas" onClick={() => setVerTodos((v) => !v)}>
                {verTodos ? "Ver menos" : `Ver los ${archivos.length} archivos`}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
