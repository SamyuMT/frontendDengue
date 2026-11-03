// Un solo juego de íconos de trazo (1.75 px), dibujados para la herramienta.
const TRAZOS = {
  capas: "M12 3 3 7.5l9 4.5 9-4.5L12 3Zm-9 9 9 4.5 9-4.5M3 16.5 12 21l9-4.5",
  documento: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h6",
  documentos: "M15 3H9a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7l-4-4Zm0 0v4h4M5 7v12a2 2 0 0 0 2 2h8",
  carpeta: "M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  carpetaAbierta: "M3 7a2 2 0 0 1 2-2h4l2 2.5h6a2 2 0 0 1 2 2V11M3 7v10a2 2 0 0 0 2 2h12.5l3.5-8H7.5L4 19",
  check: "m5 12.5 4.5 4.5L19 7.5",
  checkCirculo: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-12.5 0 2.5 2.5 5-5",
  bajo: "M12 5v14m0 0-5.5-5.5M12 19l5.5-5.5",
  alto: "M12 19V5m0 0L6.5 10.5M12 5l5.5 5.5",
  medio: "M6 12h12",
  izquierda: "m15 5-7 7 7 7",
  derecha: "m9 5 7 7-7 7",
  abajo: "m6 9 6 6 6-6",
  mas: "M12 5v14M5 12h14",
  detener: "M7 6.5A.5.5 0 0 1 7.5 6h9a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-11Z",
  reanudar: "M8 5.5v13a.5.5 0 0 0 .76.43l10.5-6.5a.5.5 0 0 0 0-.86L8.76 5.07A.5.5 0 0 0 8 5.5Z",
  eliminar: "M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3",
  cerrar: "M6 6l12 12M18 6 6 18",
  alerta: "M12 9v4m0 3.5v.01M10.3 3.9 2.6 17.4A2 2 0 0 0 4.3 20.4h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  chip: "M8 4v3m4-3v3m4-3v3M8 17v3m4-3v3m4-3v3M4 8h3m-3 4h3m-3 4h3m10-8h3m-3 4h3m-3 4h3M8 7h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z",
  nube: "M7 18a4.5 4.5 0 0 1-.5-8.97A6 6 0 0 1 18 8.5a4.75 4.75 0 0 1-.5 9.5H7Z",
  equipo: "M4 5h16v11H4zM9 20h6m-3-4v4",
  llave: "M15.5 8.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-4.2 2.4L4 18.2V21h2.8l.7-.7v-1.8h1.8l1-1v-1.8h1.8l1-1",
  rayo: "M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z",
  descargar: "M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14",
  ajustes: "M4 7h10m4 0h2M4 17h4m4 0h8M14 5v4m-6 6v4",
  tarea: "M9 5h10M9 12h10M9 19h10M4.5 5h.01M4.5 12h.01M4.5 19h.01",
  reloj: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2",
  copiar: "M9 9h10v10H9zM5 15V5h10",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-1v5m0-8.5v.01",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

interface Props {
  nombre: NombreIcono;
  tamano?: number;
  className?: string;
  titulo?: string;
}

export function Icono({ nombre, tamano = 18, className, titulo }: Props) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={titulo ? "img" : undefined}
      aria-hidden={titulo ? undefined : true}
      aria-label={titulo}
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
