# Design

Sistema visual de la Herramienta para medir Adherencia a Dengue. Base: el Figma del usuario
(«HerramientaEvalucionDengue», página `components`), **fijado por el usuario** como punto de partida;
`impeccable` (modo Operate) y `design-taste-frontend` (app screens) deciden cómo se aplica.
Tokens en `src/estilos/tokens.css`. Producto y usuarios: `PRODUCT.md`.

## Escena

Un auditor de calidad de una IPS, en su escritorio, con luz de oficina o de día, frente a un monitor
de 1280–1920 px. Revisa lotes durante la jornada y vuelve a mirar el progreso cada tanto. → **Tema
claro.** La herramienta debe desaparecer en la tarea: familiar, precisa, tranquila; la marca vive en
el color de los datos y en dos elementos propios (abajo).

## Color — estrategia «Restrained» con el violeta del Figma

| Token | Valor | Uso |
|---|---|---|
| `--fondo` | `#F7F2FA` | Fondo de la app y de la barra lateral (misma superficie: la navegación no compite) |
| `--superficie` | `#FFFFFF` | Hoja de trabajo |
| `--contenedor` | `#F3EDF7` | Campos de solo lectura, filas de resumen, paneles secundarios |
| `--borde-suave` / `--borde` | `#E6E0E9` / `#CAC4D0` | Reglas y divisores / bordes de controles |
| `--texto` / `--texto-2` / `--texto-3` | `#1D1B20` / `#49454F` / `#616161` | Tinta, secundario, auxiliar (todos ≥ 4.5:1 sobre blanco) |
| `--primario` | `#6750A4` | **Solo**: la acción principal de cada pantalla, la selección actual, el foco y los datos de adherencia |
| `--seleccion` | `#E8DEF8` | Ítem activo de la navegación, pestaña activa, tarjeta de resultado principal |
| `--acento` | `#D9CFF2` | Pista de la escala y de las etapas sin completar |
| Niveles | BAJO `#FBEDE9`/`#9B3E32` · MEDIO `#FBF3DC`/`#805C12` · ALTO `#EAF4EE`/`#27664C` | Siempre con texto + ícono (↓ — ↑), nunca solo color |
| `--error` / `--destructivo` | `#B3261E` / `#C83232` | Errores / acción de eliminar |

Reglas: el violeta no va en cromo decorativo (sin barras laterales de color, sin rellenos en todos los
botones). Los estados de tarea usan pastillas tenues de texto oscuro del mismo tono. Ningún gradiente,
brillo ni desenfoque.

## Tipografía

Una sola familia: **Poppins** (pin del Figma), empaquetada con `@fontsource/poppins` 400/500/600 —
nunca desde internet. Escala fija en rem (ratio ≈ 1.2), cifras tabulares en datos:

| Rol | Tamaño / peso | Ejemplo |
|---|---|---|
| Resultado | 38 / 600, `tabular-nums` | 3,00 |
| Título de pantalla | 25 / 600 | Crear tarea |
| Título de sección | 18 / 600 | Resumen del lote |
| Cuerpo | 14 / 400 (líneas 1.5) | Descripciones |
| Etiqueta | 14 / 500 | Nombre de la tarea |
| Meta | 12 / 400 | ID · fecha |

Números con coma decimal y dos decimales (`es-CO`), alineados a la derecha en tablas.

## Forma y profundidad

- Hoja de trabajo: radio **28 px** (rasgo del Figma), sin sombra; se separa del fondo por tono.
- Paneles internos 16 px; controles 12 px; pastillas redondas.
- Elevación solo en lo que flota (diálogos, toasts, menús): sombra `0 12px 32px rgb(29 27 32 / .14)`.
  Una cosa a la vez: borde **o** sombra.
- Íconos de trazo 1.75 px, 16–20 px, un solo juego (`src/componentes/Icono.tsx`), en gris salvo estado.

## Marca

Ícono de la aplicación: `public/favicon.svg` (mosquito trazado como circuito, degradado `#7559FF → #573CFF`,
diseñado por el usuario). Se usa como favicon y arriba del nombre en la barra lateral (44 px). Es el único
degradado permitido: es el logotipo, no un recurso de interfaz.

## Composición

- **Barra lateral 240 px** sobre el fondo: nombre del producto, «Nueva tarea», *En ejecución* y
  *Pendientes* con contador, lista *Tareas creadas* (nombre · ID · estado), y abajo *Modelos de IA*.
  Ítem activo = pastilla `--seleccion` con texto `--primario` (sin barra de color).
- **Hoja de trabajo** centrada, ancho máximo 960 px, márgenes 48 px; título a 25 px con una línea de
  descripción y una regla; contenido; pie con acciones a la derecha (secundaria contorneada, principal
  rellena).
- Tablas: encabezados 12 px gris en minúscula, reglas de 1 px, sin cebra ni banda; acciones como enlaces.

## Elementos propios del producto (la «cara» de la herramienta)

1. **Pista de etapas**: cada HC en proceso muestra las 7 etapas del pipeline (extraer → calcular
   indicador) como 7 segmentos que se llenan; la etapa en curso late suavemente. Es la misma pista en
   la lista de tareas (resumida) y en el detalle (por HC).
2. **Escala de adherencia 1–5**: una regla horizontal con las franjas BAJO (< 3), MEDIO (3–4) y ALTO
   (≥ 4) y una marca en el valor. Acompaña cada resultado grande para que el número se lea contra el
   formato de auditoría, no suelto.

## Movimiento

Curvas: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` (entradas), `--ease-in-out:
cubic-bezier(0.77, 0, 0.175, 1)` (movimientos en pantalla). Duraciones 120–250 ms; nada de `ease-in`.

| Qué | Cómo | Por qué |
|---|---|---|
| Cambio de pantalla | contenido: opacidad + 6 px en Y, 200 ms | Continuidad, sin coreografía |
| Botones | `scale(0.97)` al presionar, 120 ms | Respuesta inmediata |
| Diálogos | opacidad + `scale(0.96 → 1)` 200 ms, fondo 40 % | Estado (interrupción protegida) |
| Progreso | barra con `transform: scaleX` 400 ms; segmento en curso con pulso de opacidad | Estado vivo sin distraer |
| Selector Resumen / PDF n | indicador compartido (`layoutId`), tarjeta entra desde la dirección del cambio | Continuidad espacial |
| Resultado | cuenta ascendente del número y la marca de la escala, 600 ms, una vez | Momento poco frecuente: se permite el detalle |
| Onboarding | pasos con deslizamiento corto | Primera vez: se permite el detalle |
| Toasts (Sonner) | entrada y salida por el mismo borde | Consistencia espacial |

Nunca se anima lo que se repite muchas veces (navegación por teclado, filas que cambian cada segundo).
`MotionConfig reducedMotion="user"` + `@media (prefers-reduced-motion)` en CSS.

## Estados

Cada control: reposo, hover, foco (anillo 2 px `--primario` con separación 2 px), activo, deshabilitado
(`#F6F6F6` / `#A5A5A5`), cargando, error. Cargas con esqueletos en el lugar del contenido; vacíos que
enseñan qué hacer; errores que dicen el problema y la salida. Superficies del navegador tematizadas:
selección de texto `--seleccion`, barras de desplazamiento finas en `--borde`, `accent-color`.

## Traducciones respecto al Figma

- Se quita «Ruta de salida» (salida fija `resultados/<id>`); en su lugar, botón **Abrir carpeta de resultados**.
- La ruta de entrada se elige con el diálogo nativo de Windows (**Elegir carpeta…**) y se valida
  contando los PDF.
- Las tarjetas de *Tareas creadas* pierden la barra izquierda de color (regla del sistema); la
  selección se marca con superficie blanca y texto primario.
- Se agregan: selector de modelo y opciones avanzadas en Crear tarea, progreso y pista de etapas,
  Modelos de IA, onboarding, estado «conectando», aviso de resultado no confiable y filtro de manejo.
