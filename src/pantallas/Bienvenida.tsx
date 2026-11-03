import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Boton } from "../componentes/Boton.tsx";
import { EscalaAdherencia } from "../componentes/EscalaAdherencia.tsx";
import { Icono } from "../componentes/Icono.tsx";
import { NivelPastilla } from "../componentes/Pastillas.tsx";
import { PistaEtapas } from "../componentes/PistaEtapas.tsx";
import { useApp } from "../ContextoApp.tsx";
import { ETAPA, proveedor } from "../datos/formato.ts";

const CLAVE = "adherencia.onboardingVisto";
export const onboardingVisto = () => localStorage.getItem(CLAVE) === "1";
const marcarVisto = () => localStorage.setItem(CLAVE, "1");

const ETAPAS = ["extraer", "limpiar", "anonimizar", "normalizar", "filtrar", "evaluar_llm", "calcular_indicador"];

/** Primera vez: tres pasos cortos que muestran (no cuentan) cómo funciona, y llevan a la primera tarea. */
export function Bienvenida() {
  const { modelos, tareas } = useApp();
  const navegar = useNavigate();
  const [paso, setPaso] = useState(0);
  const [direccion, setDireccion] = useState(1);

  const ir = (nuevo: number) => {
    setDireccion(nuevo > paso ? 1 : -1);
    setPaso(nuevo);
  };
  const terminar = (destino: string) => {
    marcarVisto();
    navegar(destino);
  };

  const pasos = [
    {
      titulo: "Evalúe un lote de historias clínicas en un paso",
      cuerpo: <PasoComo />,
    },
    {
      titulo: modelos.length ? "Los modelos de IA ya están listos" : "Falta vincular un modelo de IA",
      cuerpo: <PasoModelos />,
    },
    {
      titulo: "Su primera tarea",
      cuerpo: <PasoTarea />,
    },
  ];

  return (
    <section className="bienvenida">
      <div className="bienvenida__progreso" aria-hidden>
        {pasos.map((_, i) => (
          <span key={i} className={`bienvenida__marca${i <= paso ? " bienvenida__marca--hecha" : ""}`} />
        ))}
      </div>
      <p className="bienvenida__paso cifra">
        Paso {paso + 1} de {pasos.length}
      </p>

      <AnimatePresence mode="wait" initial={false} custom={direccion}>
        <motion.div
          key={paso}
          initial={{ opacity: 0, x: 20 * direccion }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 * direccion }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="bienvenida__titulo">{pasos[paso].titulo}</h1>
          {pasos[paso].cuerpo}
        </motion.div>
      </AnimatePresence>

      <footer className="bienvenida__pie">
        <button type="button" className="enlace" onClick={() => terminar(tareas.length ? "/tareas/en-ejecucion" : "/tareas/nueva")}>
          Saltar introducción
        </button>
        <div className="hoja__acciones">
          {paso > 0 && <Boton onClick={() => ir(paso - 1)}>Atrás</Boton>}
          {paso < pasos.length - 1 ? (
            <Boton variante="principal" onClick={() => ir(paso + 1)}>
              Continuar
            </Boton>
          ) : modelos.length ? (
            <Boton variante="principal" icono="mas" onClick={() => terminar("/tareas/nueva")}>
              Crear mi primera tarea
            </Boton>
          ) : (
            <Boton variante="principal" icono="chip" onClick={() => terminar("/modelos")}>
              Ir a Modelos de IA
            </Boton>
          )}
        </div>
      </footer>
    </section>
  );
}

/** Demostración viva: una HC recorre las 7 etapas y termina en la escala de adherencia. */
function PasoComo() {
  const [etapa, setEtapa] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setEtapa((e) => (e + 1) % (ETAPAS.length + 2)), 900);
    return () => clearInterval(t);
  }, []);
  const terminada = etapa >= ETAPAS.length;

  return (
    <div className="bienvenida__cuerpo">
      <p className="bienvenida__texto">
        Elija la carpeta con los PDF. La herramienta anonimiza cada historia clínica, busca las secciones de la Guía de Práctica
        Clínica de dengue y la evalúa ítem por ítem con IA, con el mismo formato de auditoría (SI / NO / PARCIAL → 1 a 5).
      </p>
      <div className="demo" aria-label="Ejemplo de una historia clínica en evaluación">
        <div className="demo__fila">
          <span className="demo__archivo">
            <Icono nombre="documento" tamano={16} /> HistoriaEjemplo.pdf
          </span>
          <PistaEtapas
            etapas={ETAPAS}
            estado={terminada ? "completado" : "en_proceso"}
            etapa={terminada ? null : ETAPAS[etapa]}
          />
          <span className="demo__etapa">{terminada ? "Evaluada" : ETAPA[ETAPAS[etapa]]}</span>
        </div>
        <div className={`demo__resultado${terminada ? " demo__resultado--visible" : ""}`}>
          <span className="demo__cifra cifra">3,72</span>
          <NivelPastilla nivel="MEDIO" />
          <div className="demo__escala">
            <EscalaAdherencia valor={terminada ? 3.72 : null} />
          </div>
        </div>
        <p className="demo__nota">Datos de ejemplo</p>
      </div>
      <ul className="bienvenida__puntos">
        <li>
          <Icono nombre="equipo" tamano={18} /> Todo corre en este equipo; los nombres y documentos se anonimizan antes de consultar a la IA.
        </li>
        <li>
          <Icono nombre="carpeta" tamano={18} /> El reporte Excel queda solo en la carpeta <strong>resultados</strong>.
        </li>
        <li>
          <Icono nombre="reanudar" tamano={18} /> Si cierra la herramienta a mitad de un lote, lo reanuda sin repetir lo ya evaluado.
        </li>
      </ul>
    </div>
  );
}

function PasoModelos() {
  const { modelos } = useApp();
  if (modelos.length === 0) {
    return (
      <div className="bienvenida__cuerpo">
        <p className="bienvenida__texto">
          Para evaluar se necesita al menos un modelo de IA: uno en internet (OpenAI, DeepSeek, Gemini…) con su llave, o uno que
          corra en este equipo (Ollama, LM Studio). <strong>Normalmente lo configura la persona técnica una sola vez</strong>; después
          usted solo lo elige de una lista.
        </p>
      </div>
    );
  }
  return (
    <div className="bienvenida__cuerpo">
      <p className="bienvenida__texto">Al crear una tarea elegirá uno de estos. Si el elegido falla, la herramienta prueba con los demás.</p>
      <ul className="bienvenida__modelos">
        {modelos.map((m) => {
          const p = proveedor(m);
          return (
            <li key={m.nombre}>
              <Icono nombre={p.local ? "equipo" : "nube"} tamano={17} />
              <strong>{m.nombre}</strong>
              <span>
                {p.nombre} · {m.modelo}
              </span>
              {m.api_key_env && !m.api_key_configurada && <span className="pastilla pastilla--aviso">Falta la llave</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PasoTarea() {
  const { modelos } = useApp();
  return (
    <div className="bienvenida__cuerpo">
      <ol className="bienvenida__lista">
        <li>Póngale un nombre, p. ej. «Revisión de lote de noviembre».</li>
        <li>
          Pulse <strong>Elegir carpeta…</strong> y seleccione la carpeta con los PDF: verá cuántas historias clínicas encontró.
        </li>
        <li>Elija el modelo de IA y cree la tarea. Podrá seguir el avance de cada historia clínica.</li>
      </ol>
      {!modelos.length && (
        <p className="bienvenida__texto">Primero vincule un modelo de IA (o pida a la persona técnica que lo haga).</p>
      )}
    </div>
  );
}
