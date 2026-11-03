import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Consulta `cargar` al montar y cada `intervaloMs` (null = solo una vez).
 * Mantiene los últimos datos buenos si una consulta falla (p. ej. el servidor se reinicia).
 */
export function usePolling<T>(cargar: () => Promise<T>, intervaloMs: number | null, dependencias: unknown[] = []) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [cargando, setCargando] = useState(true);
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  const recargar = useCallback(async () => {
    try {
      const nuevos = await cargarRef.current();
      setDatos(nuevos);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    setCargando(true);
    setDatos(null);
    void recargar();
    if (intervaloMs === null) return;
    const temporizador = setInterval(() => void recargar(), intervaloMs);
    return () => clearInterval(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervaloMs, recargar, ...dependencias]);

  return { datos, error, cargando, recargar };
}
