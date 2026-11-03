import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icono, type NombreIcono } from "./Icono.tsx";

type Variante = "principal" | "secundario" | "peligro" | "enlace" | "enlace-peligro";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  icono?: NombreIcono;
  cargando?: boolean;
  children: ReactNode;
}

export function Boton({ variante = "secundario", icono, cargando = false, disabled, children, className, ...resto }: Props) {
  return (
    <button
      type="button"
      {...resto}
      className={`boton boton--${variante}${className ? ` ${className}` : ""}`}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
    >
      {cargando ? <span className="boton__giro" aria-hidden /> : icono && <Icono nombre={icono} tamano={17} />}
      <span>{children}</span>
    </button>
  );
}
