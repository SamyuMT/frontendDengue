# Frontend — Herramienta para medir Adherencia a Dengue

Interfaz (React 18 + TypeScript + Vite) de la API [APIDuengue](../APIDuengue). Diseño en `DESIGN.md`,
producto en `PRODUCT.md`, contexto para desarrollo en `CLAUDE.md`.

## Ejecutar (desarrollo)

1. API (en `../APIDuengue`): `.venv\Scripts\python.exe -m uvicorn app.main:app --reload`
2. Frontend: `npm ci` (solo la primera vez) y `npm run dev` → http://localhost:5173

Vite reenvía `/v1` a `http://127.0.0.1:8000` (ver `vite.config.ts`). Para verlo servido por la API (como
en el .exe) haga `npm run build`: FastAPI sirve `dist/` en http://127.0.0.1:8000.

## Pantallas

Bienvenida (primera vez) · Crear tarea · Tareas en ejecución · Tareas pendientes · Detalle / Evaluación
final · Modelos de IA. Rutas con `#/` (hash router).
