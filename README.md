# Frontend — GPC-Dengue

Interfaz web (React 18 + TypeScript + Vite) para la API [APIDuengue](../APIDuengue).

## Ejecutar (desarrollo)

1. Levantar la API (en `../APIDuengue`):
   ```bash
   .venv\Scripts\python.exe -m uvicorn app.main:app --reload
   ```
2. Levantar el frontend:
   ```bash
   npm ci          # solo la primera vez (versiones exactas del package-lock.json)
   npm run dev
   ```
3. Abrir http://localhost:5173

En desarrollo, Vite reenvía las peticiones a `/v1` hacia `http://127.0.0.1:8000` (ver `vite.config.ts`),
así que no hace falta CORS. Para servir el build (`npm run build` → `dist/`) desde otro origen, la API
necesitará `CORSMiddleware`.

## Estructura

```
src/
├── main.tsx     # monta <App /> en #root
├── App.tsx      # pantalla inicial: estado de la API, tareas en ejecución, modelos LLM vinculados
├── api.ts       # cliente de la API (tipos + fetch)
└── index.css    # estilos (tema oscuro)
```
