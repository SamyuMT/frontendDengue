import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { calificacion } from "../datos/formato.ts";

const MIN = 1;
const MAX = 5;
const posicion = (valor: number) => ((Math.min(Math.max(valor, MIN), MAX) - MIN) / (MAX - MIN)) * 100;

/**
 * Elemento propio del producto: la escala 1–5 del formato de auditoría con sus franjas
 * BAJO (< 3), MEDIO (3–4) y ALTO (≥ 4) y una marca en el valor.
 */
export function EscalaAdherencia({ valor }: { valor: number | null | undefined }) {
  const reducir = useReducedMotion();
  const progreso = useMotionValue(reducir || valor == null ? posicion(valor ?? MIN) : 0);
  const desplazamiento = useTransform(progreso, (p) => `translateX(${p}%)`);

  useEffect(() => {
    if (valor == null) return;
    const control = animate(progreso, posicion(valor), { duration: reducir ? 0 : 0.6, ease: [0.23, 1, 0.32, 1] });
    return () => control.stop();
  }, [valor, progreso, reducir]);

  return (
    <div className="escala" aria-hidden>
      <div className="escala__pista">
        <span className="escala__franja escala__franja--bajo" style={{ width: `${posicion(3)}%` }} />
        <span className="escala__franja escala__franja--medio" style={{ width: `${posicion(4) - posicion(3)}%` }} />
        <span className="escala__franja escala__franja--alto" style={{ width: `${100 - posicion(4)}%` }} />
        {valor != null && (
          <motion.span className="escala__carril" style={{ transform: desplazamiento }}>
            <span className="escala__marca" />
          </motion.span>
        )}
      </div>
      <div className="escala__reglas">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} style={{ left: `${posicion(n)}%` }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Número que cuenta hasta su valor una vez (resultado: momento poco frecuente). */
export function CifraAnimada({ valor, className }: { valor: number | null | undefined; className?: string }) {
  const reducir = useReducedMotion();
  const [mostrado, setMostrado] = useState(reducir ? (valor ?? null) : 0);

  useEffect(() => {
    if (valor == null) {
      setMostrado(null);
      return;
    }
    if (reducir) {
      setMostrado(valor);
      return;
    }
    const control = animate(MIN, valor, { duration: 0.6, ease: [0.23, 1, 0.32, 1], onUpdate: setMostrado });
    return () => control.stop();
  }, [valor, reducir]);

  return (
    <span className={`cifra ${className ?? ""}`} aria-label={calificacion(valor)}>
      {calificacion(mostrado)}
    </span>
  );
}
