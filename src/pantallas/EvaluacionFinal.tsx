import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { ClaveIndicador, ClaveModulo, DocumentoTarea, Nivel, Tarea } from "../api.ts";
import { CifraAnimada, EscalaAdherencia } from "../componentes/EscalaAdherencia.tsx";
import { Aviso } from "../componentes/Hoja.tsx";
import { Icono } from "../componentes/Icono.tsx";
import { EstadoDocumentoPastilla, NivelPastilla } from "../componentes/Pastillas.tsx";
import { calificacion, MODULO, nivelDe } from "../datos/formato.ts";

type Valores = Partial<Record<ClaveModulo | ClaveIndicador, number | null>>;
type Niveles = Partial<Record<ClaveModulo | ClaveIndicador, Nivel>>;

interface Vista {
  clave: string;
  etiqueta: string;
  titulo: string;
  subtitulo: string;
  valores: Valores;
  niveles: Niveles;
  confiable: boolean;
  itemsFallo: string[];
  documento?: [string, DocumentoTarea];
}

const SUBMODULOS: ClaveModulo[] = ["manejo_ambulatorio", "manejo_hospitalario", "manejo_uci"];
const ATENCION: { clave: ClaveModulo | null; texto: string }[] = [
  { clave: null, texto: "Los tres" },
  { clave: "manejo_ambulatorio", texto: "Ambulatorio" },
  { clave: "manejo_hospitalario", texto: "Hospitalario" },
  { clave: "manejo_uci", texto: "UCI" },
];

/** «Evaluación final» del Figma: Resumen del lote + una tarjeta por HC, en carrusel. */
export function EvaluacionFinal({ tarea }: { tarea: Tarea }) {
  const general = tarea.reporte_general;
  const documentos = Object.entries(tarea.documentos).filter(([, d]) => d.estado === "completado" && d.indicador);

  const vistas: Vista[] = [];
  if (general) {
    vistas.push({
      clave: "resumen",
      etiqueta: "Resumen",
      titulo: "Resumen del lote",
      subtitulo: `Evaluación del lote · ${general.total_hc} ${general.total_hc === 1 ? "historia clínica" : "historias clínicas"}`,
      valores: general.general,
      niveles: general.niveles_general,
      confiable: general.confiable !== false,
      itemsFallo: general.hc_no_confiables ?? [],
    });
  }
  documentos.forEach(([docId, d], i) => {
    const ind = d.indicador!;
    vistas.push({
      clave: docId,
      etiqueta: `HC ${i + 1}`,
      titulo: d.archivo,
      subtitulo: `Historia clínica ${i + 1} de ${documentos.length} · ID ${docId}`,
      valores: { ...ind.modulos, ...ind.indicadores },
      niveles: ind.niveles,
      confiable: ind.confiable !== false,
      itemsFallo: ind.items_fallo_llm ?? [],
      documento: [docId, d],
    });
  });

  const [indice, setIndice] = useState(0);
  const [direccion, setDireccion] = useState(1);
  const [atencion, setAtencion] = useState<Record<string, ClaveModulo | null>>({});

  if (vistas.length === 0) return null;
  const actual = vistas[Math.min(indice, vistas.length - 1)];
  const ir = (nuevo: number) => {
    setDireccion(nuevo > indice ? 1 : -1);
    setIndice(nuevo);
  };
  const atencionActual = atencion[actual.clave] ?? null;
  const esResumen = actual.clave === "resumen";

  // Manejo según dónde fue atendido el paciente (solo por HC; el reporte siempre promedia los tres).
  const manejoFiltrado = atencionActual ? actual.valores[atencionActual] : null;

  return (
    <section className="evaluacion" aria-label="Evaluación final">
      <div className="evaluacion__barra">
        <div className="selector" role="tablist" aria-label="Resultado a mostrar">
          {vistas.slice(0, 9).map((v, i) => (
            <button
              key={v.clave}
              type="button"
              role="tab"
              aria-selected={i === indice}
              className={`selector__opcion${i === indice ? " selector__opcion--activa" : ""}`}
              onClick={() => ir(i)}
            >
              {i === indice && <motion.span layoutId="selector-evaluacion" className="selector__fondo" transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }} />}
              <Icono nombre={v.clave === "resumen" ? "capas" : "documento"} tamano={16} />
              <span>{v.etiqueta}</span>
            </button>
          ))}
        </div>
        <span className="evaluacion__contador cifra">
          {indice + 1} de {vistas.length}
        </span>
      </div>

      <div className="evaluacion__escenario">
        <AnimatePresence mode="popLayout" initial={false} custom={direccion}>
          <motion.article
            key={actual.clave}
            className="tarjeta-resultado"
            custom={direccion}
            initial={{ opacity: 0, x: 24 * direccion }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 * direccion }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <header className="tarjeta-resultado__encabezado">
              <span className="tarjeta-resultado__icono">
                <Icono nombre={esResumen ? "capas" : "documento"} tamano={20} />
              </span>
              <div>
                <h2 className="tarjeta-resultado__titulo">{actual.titulo}</h2>
                <p className="tarjeta-resultado__subtitulo cifra">{actual.subtitulo}</p>
              </div>
              {actual.documento && <EstadoDocumentoPastilla estado={actual.documento[1].estado} />}
            </header>

            {!actual.confiable && (
              <Aviso tono="aviso" titulo={esResumen ? "El resultado del lote no es del todo confiable" : "Resultado no del todo confiable"}>
                {esResumen
                  ? `En ${actual.itemsFallo.length} historia(s) clínica(s) ningún modelo de IA respondió algunos ítems; esos ítems se calificaron como NO.`
                  : `Ningún modelo de IA respondió ${actual.itemsFallo.length} ítem(s) (${actual.itemsFallo.join(", ")}); se calificaron como NO.`}
              </Aviso>
            )}

            <div className="resultado-principal">
              <div className="resultado-principal__texto">
                <p className="resultado-principal__titulo">Adherencia total</p>
                <p className="resultado-principal__sub">{esResumen ? "Resultado del lote" : "Resultado de la historia clínica"} · escala de 1 a 5</p>
              </div>
              <CifraAnimada valor={actual.valores.total} className="resultado-principal__cifra" />
              <NivelPastilla nivel={actual.niveles.total} grande />
              <div className="resultado-principal__escala">
                <EscalaAdherencia valor={actual.valores.total} />
              </div>
            </div>

            <h3 className="evaluacion__subtitulo">Indicadores de adherencia</h3>
            <div className="indicadores">
              {(["evaluacion_general", "diagnostico", "manejo"] as const).map((clave) => (
                <div key={clave} className="indicador">
                  <p className="indicador__titulo">{MODULO[clave]}</p>
                  <p className="indicador__sub">{clave === "manejo" ? "Indicador · 3 submódulos" : "Módulo e indicador"}</p>
                  <div className="indicador__valor">
                    <span className="cifra">{calificacion(actual.valores[clave])}</span>
                    <NivelPastilla nivel={actual.niveles[clave]} />
                  </div>
                </div>
              ))}
            </div>

            <div className="submodulos">
              <div className="submodulos__encabezado">
                <h3 className="evaluacion__subtitulo">Submódulos de manejo</h3>
                {!esResumen && (
                  <div className="filtro-atencion">
                    <span id={`atencion-${actual.clave}`}>Atención del paciente</span>
                    <div className="segmentado segmentado--pequeno" role="radiogroup" aria-labelledby={`atencion-${actual.clave}`}>
                      {ATENCION.map((o) => (
                        <button
                          key={o.texto}
                          type="button"
                          role="radio"
                          aria-checked={atencionActual === o.clave}
                          className={`segmentado__opcion${atencionActual === o.clave ? " segmentado__opcion--activa" : ""}`}
                          onClick={() => setAtencion((a) => ({ ...a, [actual.clave]: o.clave }))}
                        >
                          {o.texto}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <table className="tabla tabla--compacta">
                <thead>
                  <tr>
                    <th>Submódulo</th>
                    <th className="tabla__numero">Valor</th>
                    <th className="tabla__nivel">Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBMODULOS.map((clave) => (
                    <tr key={clave} className={atencionActual && atencionActual !== clave ? "fila--tenue" : atencionActual === clave ? "fila--elegida" : ""}>
                      <td>{MODULO[clave]}</td>
                      <td className="tabla__numero cifra">{calificacion(actual.valores[clave])}</td>
                      <td className="tabla__nivel">
                        <NivelPastilla nivel={actual.niveles[clave]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!esResumen && manejoFiltrado != null && (
                <p className="submodulos__nota">
                  Manejo según la atención del paciente: <strong className="cifra">{calificacion(manejoFiltrado)}</strong>{" "}
                  <NivelPastilla nivel={nivelDe(manejoFiltrado)} />. El reporte Excel conserva el promedio de los tres submódulos.
                </p>
              )}
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="evaluacion__navegacion">
        <button type="button" className="boton boton--secundario" disabled={indice === 0} onClick={() => ir(indice - 1)}>
          <Icono nombre="izquierda" tamano={16} />
          <span>Anterior</span>
        </button>
        <div className="puntos" aria-hidden>
          {vistas.map((v, i) => (
            <span key={v.clave} className={`puntos__punto${i === indice ? " puntos__punto--activo" : ""}`} />
          ))}
        </div>
        <button type="button" className="boton boton--secundario" disabled={indice === vistas.length - 1} onClick={() => ir(indice + 1)}>
          <span>Siguiente</span>
          <Icono nombre="derecha" tamano={16} />
        </button>
      </div>
    </section>
  );
}
