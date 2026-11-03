# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Usuario principal: auditores de calidad de IPS** (personal de calidad / auditoría médica). Hoy
  revisan historias clínicas (HC) a mano con el formato de evaluación de la Guía de Práctica Clínica
  (GPC) de dengue: ítems SI / NO / PARCIAL → calificación 1–5 → nivel. Con la herramienta procesan un
  lote de HC en PDF y obtienen la adherencia por HC y del lote.
- **Configurador técnico (una sola vez)**: una persona técnica deja listos los modelos de IA (llaves de
  API, Ollama / LM Studio) y los modelos locales. El auditor normalmente solo **elige** un modelo de la
  lista al crear una tarea; no se le debe exigir saber qué es una API key o un endpoint.

## Product Purpose

Medir la adherencia de las HC a la GPC de dengue de forma automática y trazable: el auditor elige la
carpeta con los PDF, la herramienta extrae, anonimiza, filtra y evalúa cada HC con un LLM, y entrega el
indicador por HC y del lote (evaluación general, diagnóstico, manejo ambulatorio / hospitalario / UCI;
niveles BAJO < 3, MEDIO 3–<4, ALTO ≥ 4) más un reporte Excel/JSON.
Éxito: el auditor llega del lote de PDF al resultado sin ayuda técnica, entiende qué tan confiable es
cada resultado y encuentra el reporte en su carpeta.

Es la herramienta de una tesis de maestría; los resultados se validan contra la evaluación manual de
auditores.

## Positioning

Replica el formato de evaluación que los auditores ya usan (mismos ítems, códigos 0/1/2, calificación
1–5 y niveles), corre **completamente en el equipo del auditor** (app de escritorio .exe; las HC se
anonimizan antes de enviarse a cualquier modelo) y marca explícitamente cuándo un resultado **no es
confiable** (todos los modelos fallaron en algún ítem) en vez de esconderlo.

## Operating Context

- App de escritorio local: el .exe abre una terminal con el servidor y el navegador en la herramienta
  (un solo puerto). Sin internet salvo las llamadas a proveedores LLM en la nube que se configuren.
- Junto al .exe: `config/`, `models/`, `data/`, `resultados/` y `.env`. La salida de cada tarea es fija:
  `resultados/<tarea_id>/` (reporte Excel + JSON + bitácora LLM). El auditor solo elige la carpeta de
  entrada (pega la ruta) y abre la carpeta de resultados con un botón.
- Lotes largos: ≈ 30–60 s por HC y 53 consultas LLM por HC; 45 HC tardan 15 min o más. La pantalla
  de progreso se mira mucho y por ratos; las tareas se pueden detener (al terminar la etapa en curso),
  quedar interrumpidas si se cierra la app, y reanudarse.
- Vocabulario: HC (historia clínica), GPC, adherencia, lote, tarea, ítem, módulo, nivel, IPS, auditor.

## Capabilities and Constraints

- Tareas: crear (nombre, carpeta de entrada, modelo LLM principal; opciones avanzadas: extractor
  `pymupdf`/`pdfplumber`, segmentación, modelo de embeddings local), listar, en ejecución con progreso
  por etapa, pendientes, detener, reanudar, eliminar (solo el registro, no los resultados), abrir
  carpeta de resultados, descargar Excel/JSON.
- Modelos de IA: vincular modelos locales y en la nube (cualquier API compatible con OpenAI), probar un
  modelo (consulta real, el costo de tokens se acepta), eliminar. Las llaves nunca se muestran.
- Pipeline fijo de 7 etapas: extraer → limpiar → anonimizar → normalizar → filtrar → evaluar con LLM →
  calcular indicador.
- El submódulo de manejo se reporta para ambulatorio, hospitalario y UCI aunque al paciente solo aplique
  uno; la interfaz permite filtrar según dónde estuvo el paciente.
- Español en toda la interfaz. Sin recursos de internet en tiempo de ejecución (fuentes empaquetadas).
- Datos clínicos: no mostrar texto de las HC; solo nombres de archivo, estados e indicadores.

## Brand Commitments

- Nombre visible: «Herramienta para medir Adherencia a Dengue».
- Diseño de referencia del usuario en Figma «HerramientaEvalucionDengue»
  (https://www.figma.com/design/0mSA7HcETTKEUTA2MSHdNE/HerramientaEvalucionDengue): tipografía Poppins y
  paleta Material 3 en violeta; los niveles BAJO / MEDIO / ALTO siempre llevan etiqueta además del color.
- El usuario pidió explícitamente que se vea cuidado, intuitivo, con animaciones y onboarding, y nada
  que parezca hecho por una IA.

## Evidence on Hand

- Datos reales de ejemplo: tareas `20261103_121732_d87ea8` (2 HC, corrida real con DeepSeek) en
  `../APIDuengue/data/tareas/` y sus reportes en `../APIDuengue/tests/resultados/`.
- PDF de prueba en `../APIDuengue/tests/aprocesar/`.
- No hay testimonios, métricas de uso ni validación publicada todavía: no inventarlos.

## Product Principles

1. **Del lote al resultado sin ayuda técnica**: el auditor elige carpeta y modelo; todo lo demás tiene
   valores por defecto sensatos y queda en «opciones avanzadas».
2. **Honestidad del resultado**: confiabilidad, errores por HC y NO por defecto se ven, no se esconden.
3. **Procesos largos tranquilos**: progreso claro, qué está pasando ahora, qué pasa si se detiene o se
   cierra, y cómo retomarlo.
4. **Fiel al formato de auditoría**: mismos módulos, niveles y escala que el auditor ya conoce.
5. **Local y privado**: nada sale del equipo salvo lo que va al proveedor LLM elegido, ya anonimizado.

## Accessibility & Inclusion

Contraste AA, navegación completa por teclado y foco visible, progreso anunciado con `aria-live`,
niveles con texto (no solo color), `prefers-reduced-motion` respetado.
