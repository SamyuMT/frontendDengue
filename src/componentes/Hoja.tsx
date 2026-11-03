import { motion } from "motion/react";
import type { ReactNode } from "react";

interface Props {
  titulo: ReactNode;
  descripcion?: ReactNode;
  lateral?: ReactNode;        // A la derecha del título (estado, etc.)
  children: ReactNode;
  pie?: ReactNode;            // Acciones al final de la hoja
  ancha?: boolean;
}

/** La hoja de trabajo blanca del Figma: título, descripción, regla, contenido y pie con acciones. */
export function Hoja({ titulo, descripcion, lateral, children, pie, ancha = false }: Props) {
  return (
    <motion.section
      className={`hoja${ancha ? " hoja--ancha" : ""}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
    >
      <header className="hoja__encabezado">
        <div className="hoja__titulos">
          <h1 className="hoja__titulo">{titulo}</h1>
          {descripcion && <p className="hoja__descripcion">{descripcion}</p>}
        </div>
        {lateral && <div className="hoja__lateral">{lateral}</div>}
      </header>
      <div className="hoja__contenido">{children}</div>
      {pie && <footer className="hoja__pie">{pie}</footer>}
    </motion.section>
  );
}

/** Estado vacío que enseña qué hacer (no «nada aquí»). */
export function Vacio({ titulo, children, accion }: { titulo: string; children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="vacio">
      <p className="vacio__titulo">{titulo}</p>
      <p className="vacio__texto">{children}</p>
      {accion && <div className="vacio__accion">{accion}</div>}
    </div>
  );
}

export function Esqueleto({ filas = 3 }: { filas?: number }) {
  return (
    <div className="esqueleto" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <span key={i} className="esqueleto__fila" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

export function Aviso({ tono = "info", titulo, children }: { tono?: "info" | "aviso" | "error"; titulo: string; children?: ReactNode }) {
  return (
    <div className={`aviso aviso--${tono}`} role={tono === "error" ? "alert" : "note"}>
      <p className="aviso__titulo">{titulo}</p>
      {children && <div className="aviso__texto">{children}</div>}
    </div>
  );
}
