# CLAUDE.md — Frontend (Herramienta de Evaluación de Adherencia GPC-Dengue)

Contexto completo para cualquier Claude (o persona) que retome el frontend: qué es, con qué backend
habla, cómo se diseña (Figma + skills de diseño), qué pantallas tiene, qué NO hacer y qué falta.
**Leer primero `../APIDuengue/CLAUDE.md`**: ahí está todo el dominio (pipeline, tareas, LLM, indicador).
**Actualizar la sección "Estado" al terminar cada avance.**

---

## 1. Qué es

Interfaz de la herramienta de tesis de maestría que evalúa la **adherencia de historias clínicas (HC)
en PDF a la Guía de Práctica Clínica de dengue**. El usuario (auditor / investigador) puede:

1. **Configurar modelos de IA**: modelos locales (Ollama, LM Studio) y modelos por API en internet
   (OpenAI, DeepSeek, Gemini, Anthropic…), con su llave.
2. **Crear tareas (lotes)**: nombre, carpeta de PDFs de entrada y **modelo LLM principal elegido de la
   lista de modelos disponibles**; avanzado: extractor, segmentación y modelo de embeddings local.
   **La salida es fija** (`resultados/<tarea_id>/` junto al .exe): el usuario no la elige.
3. **Seguir el progreso en vivo**: porcentaje del lote, qué HC está en qué etapa, detener y reanudar.
4. **Ver y descargar resultados**: indicador por HC y del lote, niveles (BAJO/MEDIO/ALTO), HC no
   confiables, reportes Excel y JSON.
5. Opcional: probar un modelo (consulta única / chat).

Debe sentirse como un **producto de escritorio cuidado**, no como un panel genérico hecho por una IA:
intuitivo, con onboarding, animaciones con propósito y estados vacíos/errores bien resueltos.

## 2. Cómo se ejecuta (siempre local)

- **Nunca hay servidor en internet**: todo corre en la máquina del usuario. Front y back se compilan en
  un **.exe** (PyInstaller, `../APIDuengue/lanzador.py`). Al abrirlo: terminal con el servidor + navegador.
- **Producción (.exe)**: hoy el backend sirve `frontend/dist` en `/` **en el mismo puerto** que la API
  (puerto libre desde 8000; ver `app/main.py` y `core/rutas.py` del backend). Por eso el front llama a
  rutas **relativas** (`/v1/...`): no hay CORS ni URL de API configurable.
- **Desarrollo**: dos procesos. API en `127.0.0.1:8000` y Vite en `5173` con proxy `/v1` → 8000.
- Consecuencias de diseño:
  - **Cero recursos de internet en tiempo de ejecución**: nada de Google Fonts, CDNs, imágenes remotas
    ni analítica. Fuentes con `@fontsource/*` (empaquetadas en el build) o archivos en `public/`.
  - **Carpeta de entrada** (`SelectorCarpeta.tsx`): «Elegir carpeta…» → `POST /v1/sistema/elegir-carpeta`
    abre el explorador de Windows (lo abre el servidor, misma máquina) → la ruta se copia al campo →
    `POST /v1/documents/list` cuenta los PDF y los lista. También se puede pegar la ruta (se quitan comillas).
  - **Consultar el reporte** = botón que llama `POST /v1/tareas/{id}/abrir-carpeta` (abre el explorador
    de Windows en `resultados/<tarea_id>/`). La descarga Excel/JSON queda como acción secundaria.
  - Todo lo que el usuario configure vive en el backend (`data/`, `.env`, `config/`), no en `localStorage`.
    `localStorage` solo para preferencias de UI (onboarding visto, tema, último modelo elegido).
  - La app puede abrirse con la API aún arrancando: manejar "conectando…" con reintentos, sin pantallazo de error.

## 3. Stack

| Qué | Versión / decisión |
|---|---|
| React + TypeScript + Vite | React 18, TS estricto (`tsconfig.json`), Vite con proxy (`vite.config.ts`) |
| Estilos | CSS propio con tokens (`src/estilos/tokens.css`), sin frameworks. Sistema en `DESIGN.md` |
| Dependencias (aprobadas 2026-11-03, versión fija) | `react-router` 7 (**hash router**: el backend sirve el build como estáticos, `#/ruta` nunca da 404), `motion` (`motion/react`), `sonner` (toasts), `@fontsource/poppins` (400/500/600) |
| Instalación | `npm ci` (versiones exactas del lock). Agregar dependencias con versión fija |

## 4. Contrato con la API (resumen; detalle en `../APIDuengue/CLAUDE.md` §5–7)

Cliente único en `src/api.ts` (tipos TS espejo de los schemas Pydantic de `app/schemas/`). Si cambia un
schema del backend, actualizar aquí los tipos.

| Área | Endpoints |
|---|---|
| Documentos | `POST /v1/documents/list {folder}` → `{total, files[{name, size_bytes, path}]}` (400 si la carpeta no existe) |
| Tareas | `POST /v1/tareas {nombre?, carpeta_entrada, extractor, segmentar, modelo_embeddings, modelo_llm}` (202 `{tarea_id}`; 400 carpeta/modelo inválido) · `GET /v1/tareas` (`[{tarea_id, nombre, estado, creada}]`) · `GET /v1/tareas/pendientes` · `GET /v1/tareas/en-ejecucion` · `GET /v1/tareas/{id}` · `POST /{id}/reanudar` (409 si corre) · `POST /{id}/detener` (202; 409) · `DELETE /{id}` (204; solo si no corre; borra solo el checkpoint) · `GET /{id}/reporte/{xlsx\|json}` · `POST /{id}/abrir-carpeta` (abre la carpeta de resultados; 404) |
| Sistema | `POST /v1/sistema/elegir-carpeta {inicial?}` → `{ruta}` (null si cancela): diálogo nativo de Windows abierto por el servidor |
| Modelos locales | `GET /v1/modelos/locales` → `{embeddings[], embeddings_por_defecto, extractores[]}` (se relee `models/` en cada consulta) |
| Modelos LLM | `GET /v1/llm/modelos` (sin llaves; `api_key_configurada`) · `POST /v1/llm/modelos {nombre, modelo, base_url, api_key_env, api_key?, timeout_s}` (crea o reemplaza; la llave se escribe en `.env`) · `DELETE /v1/llm/modelos/{nombre}` |
| Prueba LLM | `POST /v1/llm/consulta` (botón «Probar modelo»: el usuario acepta el costo de tokens) · `POST /v1/llm/chats` → `POST /chats/{id}/mensajes` → `GET /chats/{id}` (404 / 502 si el proveedor falla) |

Datos clave para la UI:
- **Crear tarea**: `nombre` (el front lo exige; la API lo acepta opcional), `carpeta_entrada`, `extractor` (`pymupdf` rápido ≈0,1 s/HC |
  `pdfplumber` ≈8 s/HC), `segmentar` (oraciones `true` / líneas `false`), `modelo_embeddings`
  (default `all-MiniLM-L6-v2`, carpeta en `models/`), `modelo_llm` (nombre de un modelo vinculado; si
  falla, el backend usa los demás vinculados en orden con circuit breaker).
- **Etapas** (7, mismo peso en el progreso): extraer → limpiar → anonimizar → normalizar → filtrar →
  evaluar_llm → calcular_indicador. `GET /v1/tareas/{id}` trae `etapas` en orden.
- **Estados de tarea**: `en_ejecucion`, `completada`, `completada_con_errores`, `detenida`,
  `interrumpida`, `error`. **De documento**: `pendiente`, `en_proceso`, `completado`, `error` (+ `etapa`).
- **Detener es cooperativo**: termina la etapa en curso (evaluar_llm puede tardar minutos). Mostrar
  "deteniendo…" (`deteniendo: true`) y no dar a entender que se detuvo al instante.
- **Indicador**: por HC `{modulos, indicadores, niveles}` + `confiable`; lote en `reporte_general`
  `{total_hc, general, niveles_general}`. Niveles: BAJO < 3, MEDIO 3–<4, ALTO ≥ 4 (escala 1–5).
  Macro: evaluación general, diagnóstico, manejo (= promedio ambulatorio, hospitalario, UCI).
  **El front filtra el manejo según dónde estuvo el paciente** (decisión del usuario; el back no lo "arregla").
- **Confiabilidad**: si todos los LLM fallaron en un ítem, la HC queda `confiable: false` y el lote
  también. Debe verse claramente (no esconderlo en un tooltip).
- **Llaves**: nunca se muestran ni se devuelven. Solo `api_key_configurada`. El formulario permite
  reemplazar la llave, nunca leerla.
- Tiempos reales por HC: anonimizar ≈ 21–27 s (+37 s la primera vez), evaluar = 53 consultas LLM.
  Un lote de 45 HC tarda 15 min o más: la UI de progreso es la pantalla más vista.

## 5. Pantallas y flujo (Figma «design» + lo que falta diseñar)

Estructura común del Figma: **barra lateral 220 px** (título «Herramienta para medir Adherencia a
Dengue.», enlaces *Tareas en ejecución* y *Tareas pendientes* con contador, lista *Tareas creadas* con
nombre · ID · estado) + **área de trabajo** con una tarjeta blanca grande de esquinas muy redondeadas.
Ventana de 1280 px.

| Pantalla | Nodo Figma | Notas para implementar |
|---|---|---|
| Crear tarea | `13:34` | Nombre, ruta de entrada. **Quitar «Ruta de salida»** (salida fija). Agregar selector de modelo LLM y «Opciones avanzadas» plegadas (extractor, segmentación, embeddings de `/v1/modelos/locales`). Validar la ruta y mostrar cuántos PDF hay |
| Tareas en ejecución | `13:1703` | Tabla tarea / estado / acciones (Ver detalle, Detener). Agregar progreso (% y etapa en curso) que el Figma no tiene |
| Tareas pendientes | `13:1626` | Detenidas / interrumpidas / con errores → Ver detalle |
| Detalle de tarea | `13:1782` | ID, estado, nombre, ruta de entrada (solo lectura). Cambiar «Ruta de salida» por botón **Abrir carpeta de resultados**. Agregar lista de HC con estado/etapa |
| Reanudar / Detener / Eliminar tarea | `13:1851`, `13:1938`, `13:2023` | Diálogos de confirmación (560 px) sobre la pantalla. Detener explica que termina la etapa en curso |
| Evaluación final · Resumen del lote | `21:759` | Encabezado (ID, creada, finalizada, estado), barra «N documentos · completados · errores», selector Resumen / PDF n, carrusel con tarjeta: adherencia total grande + nivel, 3 indicadores, tabla de submódulos de manejo. Agregar «Abrir carpeta de resultados» y aviso de **no confiable** |
| Evaluación final · por HC | `21:896`, `21:1036` | Misma tarjeta por documento (nombre del PDF, «Documento n de N», ID, estado) |
| Sistema de diseño | página `components` (`25:11`) | Tipografía `29:5`, paleta `29:86`, 74 componentes: botones `29:220`, navegación `29:256`, estados `29:302`, formularios `29:330`, resultados `29:351`, gestión `29:383`, diálogos `29:398`, iconos `29:410` |

**Falta en el Figma (diseñar y agregar al archivo):** onboarding (primera vez), **Modelos de IA**
(lista, agregar desde plantilla de proveedor —OpenAI, DeepSeek `https://api.deepseek.com`, Gemini,
Anthropic, Ollama `http://localhost:11434/v1`, LM Studio `http://localhost:1234/v1`—, probar, eliminar;
pensado para el configurador técnico), estado «conectando con el servidor», progreso en vivo por HC,
estados vacíos y de error, filtro de manejo (ambulatorio / hospitalario / UCI) en resultados.

Onboarding: corto (el usuario es auditor, los modelos los deja listos alguien técnico). Si no hay
modelos vinculados, guiar a «Modelos de IA» indicando que lo haga la persona técnica; si los hay, guiar
a crear la primera tarea. Visto → `localStorage`.

## 6. Diseño: Figma + skills

### Figma
- Archivo: **HerramientaEvalucionDengue** —
  https://www.figma.com/design/0mSA7HcETTKEUTA2MSHdNE/HerramientaEvalucionDengue — fileKey
  `0mSA7HcETTKEUTA2MSHdNE`. Páginas: `design` (`0:1`, pantallas) y `components` (`25:11`, sistema).
- **Sistema de diseño del Figma** (punto de partida de los tokens; `impeccable` decide cómo elevarlo):
  - Tipografía **Poppins** (empaquetar con `@fontsource/poppins`): resultado 38 SemiBold, títulos
    25/24/22/18 SemiBold, cuerpo 14–15, etiquetas 10–12.
  - Paleta Material 3 violeta: fondo `#F7F2FA`, contenedor suave `#F3EDF7`, borde suave `#E6E0E9`,
    borde `#CAC4D0`, texto `#1D1B20` / secundario `#49454F` / auxiliar `#616161`, superficie `#FFFFFF`,
    **primario `#6750A4`**, seleccionado `#E8DEF8`, acento tarjetas `#D9CFF2`, error `#B3261E`,
    destructivo `#C83232`, deshabilitado `#F6F6F6` / texto `#A5A5A5`.
  - Niveles (siempre con etiqueta + ícono, no solo color): BAJO fondo `#FBEDE9` texto `#9B3E32`;
    MEDIO `#FBF3DC` / `#805C12`; ALTO `#EAF4EE` / `#27664C`.
  - Íconos usados: arrow-down/up, chevron-left/right, circle-check, file-text, files, layers, minus.
- MCP de Figma configurado en `../.mcp.json` (cuenta SamMT1, asiento **Dev**). Antes de usar
  `use_figma`, cargar la skill `figma-use`; antes de `get_design_context`, `figma-design-to-code`;
  para llevar pantallas del código a Figma, `figma-generate-design`. Siempre `create_session` primero.
- **Figma es referencia, no plantilla**: tomar estructura, contenido y flujo; el acabado visual lo
  elevan las skills. Si el código se aleja del Figma, **actualizar el Figma** para que ambos queden
  sincronizados (el usuario quiere el Figma del desarrollo al día).

### Skills (instaladas en `../.agents/skills`, enlazadas en `../.claude/skills`)
| Skill | Para qué en este proyecto |
|---|---|
| `impeccable` (pbakaus) | Dirección general. Modo **Operate** (app de trabajo). `init` → `PRODUCT.md`; `document` → `DESIGN.md`; `shape` antes de cada pantalla; `onboard` para el onboarding; `harden`, `clarify`, `polish`, `audit` antes de cerrar una pantalla |
| `design-taste-frontend` (leonxlnx) | Anti-"hecho por IA". Esta app es **app screen**: seguir `references/app-screens.md` (`draw.mjs --app`, `inspect.mjs --app`) con su ciclo de capturas y corrección |
| `emil-design-eng` (Emil Kowalski) | Criterio de pulido y de componentes |
| `animate`, `review-animations`, `animation-performance`, `find-animation-opportunities` | Movimiento: crear, revisar, rendimiento, dónde sí animar |
| `ask-sonner`, `pick-ui-library`, `break-ui`, `prototype` | Toasts, elección de librerías, datos extremos (nombres largos, 0 tareas, 500 HC), variantes |

Orden de trabajo por pantalla: Figma (leer) → `impeccable shape` → construir → animación con propósito
→ `break-ui` / `harden` → capturas y corrección (taste) → `review-animations` → actualizar Figma.

### Criterios de diseño (no negociables)
- Nada de estética genérica de IA: sin gradientes decorativos, glows, emojis como íconos, tarjetas de
  ícono en cuadrado teñido, números inventados.
- Animación con propósito: entradas de pantalla, cambios de estado, progreso, feedback de acciones.
  Nada animado en acciones de teclado ni en datos que cambian cada segundo. Respetar
  `prefers-reduced-motion`. Animar solo `transform`/`opacity`.
- Accesible: contraste AA, foco visible, navegación por teclado, `aria-live` para el progreso.
- Español en toda la UI, con vocabulario clínico correcto (HC, GPC, adherencia, auditor).
- Ventana de escritorio (≥ 1280 px) como caso principal; que no se rompa a 1024 px.

## 7. Estructura

```
src/
├── main.tsx                 # fuentes, estilos, MotionConfig, ProveedorApp, hash router, Toaster
├── Marco.tsx                # barra lateral + área de trabajo + aviso de conexión; Inicio (redirección)
├── ContextoApp.tsx          # sondeo global (2 s con tareas activas, 4 s si no): tareas, activas, modelos
├── api.ts                   # ÚNICO cliente HTTP + tipos espejo del backend (ErrorApi con el `detail`)
├── datos/formato.ts         # números es-CO, fechas, nombres de estados/etapas/módulos, proveedor()
├── hooks/usePolling.ts
├── estilos/                 # tokens.css, base.css, componentes.css, pantallas.css
├── componentes/             # Boton, Icono (juego propio), Pastillas (estado/nivel), Dialogo, Hoja/Vacio/Aviso/Esqueleto,
│                            # SelectorCarpeta, PistaEtapas, EscalaAdherencia (+CifraAnimada), BarraLateral, AccionesTarea
└── pantallas/               # Bienvenida, CrearTarea, ListaTareas (en ejecución / pendientes), DetalleTarea,
                             # EvaluacionFinal (carrusel Resumen / HC n), ModelosIA
```
Rutas: `#/bienvenida`, `#/tareas/nueva`, `#/tareas/en-ejecucion`, `#/tareas/pendientes`, `#/tareas/:id`, `#/modelos`.
Código simple, en español, una responsabilidad por archivo.

## 8. Cómo trabaja el usuario (igual que en el backend)

- **Ir de a poco**: una pantalla o funcionalidad a la vez; no crear lo que no pidió.
- Cuando dice "pregunta", "solo dime" o "no lo hagas": responder sin modificar código.
- Cuestionarlo cuando algo no es buena práctica.
- Él hace commits y push salvo que lo pida.
- **No modificar el backend desde aquí sin preguntar**; si el front necesita un endpoint, proponerlo
  (ver §10) y esperar aprobación.

## 9. Cómo probar

- **No levantar uvicorn sin revisar el puerto 8000**: el usuario suele tener su propio `--reload`
  corriendo. Si ya está, usarlo; si no, preguntar antes de levantarlo.
- **No crear tareas reales** con muchos PDF ni consultas a proveedores pagos sin permiso. Probar con
  1 PDF de `../APIDuengue/tests/aprocesar` o con datos simulados.
- `npm run dev` → http://localhost:5173. `npm run build` (tsc + vite) debe pasar sin errores antes de
  dar algo por terminado. Para ver el front desde el backend (puerto 8000) hay que hacer `npm run build`.
- Revisar visualmente con capturas (inspector de taste-skill o navegador) a 1280 y 1440 px.

## 10. Backend: lo que se agregó para el front y lo que falta

Agregado el 2026-11-03 (con permiso del usuario): salida fija `resultados/<tarea_id>`,
`POST /v1/tareas/{id}/abrir-carpeta`, `GET /v1/modelos/locales`, `nombre` de la tarea.

Falta (proponer, no implementar sin permiso):
- Probar conexión sin gastar tokens (hoy «Probar» usa `/v1/llm/consulta`; aceptado por el usuario).
- `GET /v1/llm/circuitos` (estado de circuit breakers), pendiente P2 del backend.
- Abrir la carpeta `resultados/` general o un diálogo nativo para elegir la carpeta de entrada (hoy se pega la ruta).

## 11. Estado (2026-11-03)

### Hecho
- `PRODUCT.md` (impeccable init) y `DESIGN.md` (sistema del Figma fijado por el usuario + reglas de
  impeccable/taste: color en datos y acción principal, superficies planas, elementos propios = pista de
  etapas y escala 1–5, movimiento con curvas de Emil).
- Front conectado al backend: onboarding de 3 pasos (demo viva), Crear tarea (selector nativo de carpeta +
  conteo de PDF, modelo, opciones avanzadas desde `/v1/modelos/locales`), Tareas en ejecución (progreso),
  Pendientes, Detalle (progreso en vivo, pista de etapas por HC, acciones con diálogos, abrir carpeta,
  descargar Excel/JSON), Evaluación final (Resumen + HC, escala, filtro de atención para manejo, aviso
  de no confiable), Modelos de IA (plantillas por proveedor, probar, editar, quitar).
- Verificado: `npm run build` sin errores; inspector de taste-skill (`--app`) sin fallas a 1440 y 768 px
  (a 390 px no aplica: app de escritorio); `impeccable detect` sin hallazgos; capturas revisadas.

- Probado por el usuario (diálogo de carpeta y tarea real). Ícono `public/favicon.svg` en pestaña y barra lateral.
- Figma: página **«Desarrollo · Implementado»** (`38:8`) con las pantallas construidas, capturadas del
  front con `generate_figma_design` (capas editables en Poppins): Bienvenida `40:8`, Crear tarea `41:2`,
  En ejecución `39:2`, Pendientes `44:2`, Evaluación final `42:2`, Modelos de IA `43:2`, nota `45:8`.
  Para recapturar: script temporal en `index.html` + `?ruta=` con router en memoria (ver historial), sin dejarlo en el código.
- Revisión `review-animations`: sin animar height/left/width (paneles con opacidad + y; escala con
  `transform`), entrada de pantalla 150 ms, salidas de diálogo más rápidas que las entradas.

### Pendiente
- [ ] Reconstruir en Figma las pantallas nuevas con componentes del sistema (`components`), si se quiere
      que las capturas pasen a instancias enlazadas.
- [ ] Opcional: `GET /v1/llm/circuitos` para mostrar modelos caídos.
