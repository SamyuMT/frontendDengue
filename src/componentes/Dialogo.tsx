import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { Boton } from "./Boton.tsx";
import { Icono, type NombreIcono } from "./Icono.tsx";

interface Props {
  abierto: boolean;
  titulo: string;
  icono?: NombreIcono;
  tono?: "normal" | "peligro";
  children: ReactNode;
  textoConfirmar: string;
  confirmando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}

/** Confirmación para acciones que interrumpen o borran algo (detener, reanudar, eliminar). */
export function Dialogo({ abierto, titulo, icono, tono = "normal", children, textoConfirmar, confirmando, onConfirmar, onCerrar }: Props) {
  const confirmarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmando) onCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    // Foco en la acción segura (cancelar) para no confirmar por accidente con Enter.
    requestAnimationFrame(() => confirmarRef.current?.querySelector<HTMLButtonElement>(".boton--secundario")?.focus());
    return () => {
      document.removeEventListener("keydown", alTeclear);
      anterior?.focus();
    };
  }, [abierto, confirmando, onCerrar]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="dialogo__velo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.18 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !confirmando) onCerrar();
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialogo-titulo"
            className="dialogo"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {icono && (
              <span className={`dialogo__icono${tono === "peligro" ? " dialogo__icono--peligro" : ""}`}>
                <Icono nombre={icono} tamano={22} />
              </span>
            )}
            <h2 id="dialogo-titulo" className="dialogo__titulo">
              {titulo}
            </h2>
            <div className="dialogo__cuerpo">{children}</div>
            <div className="dialogo__acciones" ref={confirmarRef}>
              <Boton variante="secundario" onClick={onCerrar} disabled={confirmando}>
                Cancelar
              </Boton>
              <Boton variante={tono === "peligro" ? "peligro" : "principal"} onClick={onConfirmar} cargando={confirmando}>
                {textoConfirmar}
              </Boton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
