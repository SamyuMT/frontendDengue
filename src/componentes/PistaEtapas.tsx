import type { EstadoDocumento } from "../api.ts";
import { ETAPA, ETAPA_CORTA } from "../datos/formato.ts";

interface Props {
  etapas: string[];
  estado: EstadoDocumento;
  etapa: string | null;     // En curso, o donde falló
  conEtiqueta?: boolean;
}

/**
 * Elemento propio del producto: las 7 etapas del pipeline como segmentos que se llenan.
 * Hechas = llenas; en curso = late; fallida = roja; pendientes = pista.
 */
export function PistaEtapas({ etapas, estado, etapa, conEtiqueta = false }: Props) {
  const indice = etapa ? etapas.indexOf(etapa) : -1;
  const estadoSegmento = (i: number) => {
    if (estado === "completado") return "hecha";
    if (estado === "error") return i < indice ? "hecha" : i === indice ? "fallida" : "pendiente";
    if (estado === "en_proceso") return i < indice ? "hecha" : i === indice ? "en-curso" : "pendiente";
    return "pendiente";
  };
  const descripcion =
    estado === "completado"
      ? "Todas las etapas terminadas"
      : estado === "error" && etapa
        ? `Falló en: ${ETAPA_CORTA[etapa] ?? etapa}`
        : estado === "en_proceso" && etapa
          ? `${ETAPA[etapa] ?? etapa} (etapa ${indice + 1} de ${etapas.length})`
          : estado === "en_proceso"
            ? "En cola"
            : "Pendiente";

  return (
    <div className="pista">
      <div className="pista__segmentos" role="img" aria-label={descripcion}>
        {etapas.map((nombre, i) => (
          <span key={nombre} className={`pista__segmento pista__segmento--${estadoSegmento(i)}`} title={ETAPA_CORTA[nombre] ?? nombre} />
        ))}
      </div>
      {conEtiqueta && <span className="pista__texto">{descripcion}</span>}
    </div>
  );
}
