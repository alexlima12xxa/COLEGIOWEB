# Migración del modelo de render (evaluación)

> Documento informativo para evaluar la viabilidad de migrar el modelo de
> render de la web pública. No contiene pasos de implementación: es el marco
> de decisión para retomar el tema en su momento.

## 1. Situación actual

- 1 repositorio → 1 Supabase multi-tenant → N proyectos Vercel estáticos
  (Astro `output: "static"`, un build por colegio).
- El contenido editorial se lee de Supabase **solo en build-time**.
- Cuando un director publica o edita contenido, el panel admin dispara un
  rebuild específico del colegio vía `tenant_settings.rebuild_hook_url`.
- Decisión tomada hoy: **mantener este modelo** (SSG + rebuild por colegio).

## 2. Motivo de una posible migración

- **Costo/tiempo de build**: cada cambio de contenido exige reconstruir la web
  del colegio completo.
- **Latencia**: el cambio tarda del orden de 1–2 minutos en verse en producción
  (tiempo de build + deploy).
- Estos factores se vuelven relevantes al crecer el número de colegios (≈50) o
  cuando el rebuild se percibe como doloroso para el flujo de edición.

## 3. Por qué hoy es viable el modelo actual

- A 2 colegios el costo de build es despreciable y la latencia es aceptable.
- El aislamiento por tenant ya está resuelto (RLS + `rebuild_hook_url` por
  colegio): cada guardado reconstruye solo su colegio.

## 4. El problema real a escala

El cuello de botella **no es el "Ignored Build Step"** ni los deploy hooks, sino
el propio modelo **SSG + rebuild manual por cada guardado**. A medida que crece
el contenido y el número de colegios, ese modelo replica builds enteros con
latencia y costo proporcional al tamaño del colegio.

## 5. Opción de migración a evaluar

Mover a un render en runtime con **Astro `hybrid` / ISR on-demand**, lo que
permite una migración **incremental** (páginas estáticas que siguen SSG y solo
las dinámicas pasan a on-demand), evitando un "big bang".

## 6. Qué cambia y qué NO se rompe

| Área | ¿Cambia? | Nota |
|---|---|---|
| `output` en `astro.config.ts` | Sí | De `static` a `hybrid`/`server` |
| Lectura de datos en runtime | Sí | Pasar de service role key (build-time) a anon key (runtime, respeta RLS) |
| Páginas que pasan a on-demand | Sí | Solo las que cambian con frecuencia de contenido |
| Esquema Supabase (tablas, `tenant_id`) | No | Se reutiliza igual |
| RLS y aislamiento por tenant | No | Se mantiene |
| Catálogo de banners (`packages/shared`) | No | Se mantiene |
| Marca por colegio (`configs/<slug>.ts`, `public/branding/`) | No | Se mantiene |
| Panel admin | No (casi) | Ya es multi-tenant por JWT + RLS |

El punto delicado es localizado: reemplazar la **service role key** por la
**anon key** en la lectura de datos en runtime (la service role no debe llegar
al navegador). No requiere un rewrite total del patrón de datos.

## 7. Criterios para decidir / cuándo reevaluar

- Número de colegios se acerca al umbral objetivo (≈50).
- El tiempo de build por colegio empieza a sentirse en el flujo de edición.
- La latencia entre "guardar" y "ver en producción" se vuelve un obstáculo.
- El costo de builds replica crece de forma no lineal.

Cuando se cumpla alguno de estos criterios, evaluar la migración a `hybrid` /
ISR on-demand, priorizando el punto de corte incremental descrito en la
sección 5 y 6.