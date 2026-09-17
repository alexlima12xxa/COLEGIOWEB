# Estandarización de banners — contrato de dos capas

> **Creado:** 2026-09-17 08:15 (plan) · ejecución iniciada 2026-09-17
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro SSG (web) + Next.js (admin) + Supabase · monorepo pnpm
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** ✅ COMPLETADO (15/15 pasos · 3 commits · verificación A+B+C)

---

## Plan original

> Fuente: `reports/2026-09-17_plan-estandarizacion-banners.md` (intacto).
> Resumen del plan completo a continuación.

### Objetivo

Estandarizar la **capa externa** (`.banner`) como marco de altura rígida para el carrusel
(sin CLS entre slides) y definir las **reglas de contención** de la **capa interna**
(`.banner__container`) con default de apilado mobile overrideable. Cada plantilla
conserva su propio motor de layout (`flex` o `grid`).

Adicionalmente: eliminar la plantilla obsoleta `prueba` del código y dejar el contrato
**documentado y copiable** para plantillas futuras.

### Principio rector

> El estándar NO se adapta ni se modifica según los banners existentes.
> Los banners —nuevos o recreados— se ajustan al estándar.

### Decisiones tomadas

| Decisión | Valor |
|---|---|
| Migración de contenedores existentes a `.banner__container` | **Opción A** — NO migrar |
| Distribución mobile | **Default de apilado** en la base, overrideable por plantilla |
| Mecanismo desktop | `aspect-ratio` vía variable `--banner-aspect-ratio` |
| `prueba` | **Se elimina del código** |
| `matricula-banner` | Se mantiene temporalmente; se recreará bajo el estándar más adelante |
| Referencia para plantillas futuras | **`README.md`** (fuente única) |

### Fase 1 — Contrato universal en `packages/shared/src/banners/css/_banner.css`

- **1.1 Capa externa (`.banner`)**: `position: relative`, `isolation: isolate`, `width: 100%`,
  `height/min-height: 80vh`, `display: flex`, `justify-content/align-items: center`,
  `overflow: hidden`, fondo `--color-surface-inverse`, y
  `--banner-padding-total: calc(var(--banner-padding-mobile, 1.5rem) * 2)`.
- **1.2 Capa interna (`.banner__container`)**: `width: 100%`,
  `max-width: var(--banner-container-max, 1600px)`, `max-height: 100%`,
  `aspect-ratio: var(--banner-aspect-ratio, auto)`. **SIN** display/flex/grid/gap/justify.
- **1.3 Contención de media universal**: `.banner__container :is(img, svg, video)` →
  `flex-shrink: 1`, `min-height: 0`, `max-height: var(--banner-img-max-height, 30dvh)`,
  `object-fit: contain`.
- **1.4 Mobile/Tablet (`max-width: 1023px`)**: `.banner` → `height/min-height: 90dvh` +
  `padding: var(--banner-padding-mobile, 1.5rem)`; `.banner__container` →
  `max-height: calc(90dvh - var(--banner-padding-total, 3rem))`, `aspect-ratio: auto`,
  `min-height: 0` + default de apilado (`flex` / `column` / `space-between` / `center` /
  `gap: var(--banner-gap-mobile, 1rem)`).
- **API de variables**: `--banner-container-max` (1600px), `--banner-aspect-ratio` (auto),
  `--banner-img-max-height` (30dvh), `--banner-gap-mobile` (1rem),
  `--banner-padding-mobile` (1.5rem), `--banner-padding-total` (derivada).
- **Regla**: declarar la proporción con `--banner-aspect-ratio: W / H`, **nunca** con la
  propiedad `aspect-ratio` directa.

### Fase 2 — Eliminar la plantilla `prueba`

| # | Archivo | Acción |
|---|---|---|
| 2.1 | `packages/shared/src/banners/css/prueba.css` | Eliminar |
| 2.2 | `apps/web/src/features/home/components/HomeBanner/templates/BannerPrueba.astro` | Eliminar |
| 2.3 | `packages/shared/src/banners/catalogo.ts` | Quitar entrada `prueba`; `BANNERS_SLUGS = ["matricula-banner"]`; quitar import de `palettes` |
| 2.4 | `packages/shared/src/banners/palettes.ts` | Eliminar (queda muerto) + quitar su export en `banners/index.ts` |
| 2.5 | `packages/shared/package.json` | Quitar export `"./banners/css/prueba.css"` |
| 2.6 | `apps/web/.../HomeBanner/HomeBanner.astro` | Quitar import y entrada `prueba` de `COMPONENTES` |
| 2.7 | `apps/web/src/data/fallback/banners.json` | Reapuntar a `matricula-banner` (usar `nino-birrete.avif`) o quitar el item |
| 2.8 | Supabase (BD) | Eliminar la instancia del banner `prueba` (manual, vía admin) |

### Fase 3 — Documentación canónica del contrato

- **3.1** Reescribir `packages/shared/src/banners/README.md`: añadir `.banner__container` a la
  tabla de piezas, reemplazar el ejemplo con `min-height: 90dvh` por el contrato de dos capas,
  envolver el markup de ejemplo en `<div class="banner__container">`, sustituir la convención
  vieja del hero, añadir secciones **Contrato de dos capas** + **Esqueleto copiable**.
- **3.2** Actualizar `packages/shared/src/banners/figma-prompt.md`: documentar los dos modos de
  canvas (full-bleed / contained) e indicar que la proporción del canvas alimenta
  `--banner-aspect-ratio`.

### Fase 4 — Verificación

- [ ] `pnpm --filter @web-modelo/shared test`
- [ ] `pnpm --filter @web-modelo/web check`
- [ ] `pnpm --filter @web-modelo/web build`
- [ ] `pnpm --filter @web-modelo/admin build`
- [ ] El admin ya no ofrece `prueba` como plantilla
- [ ] Hero en dev/local: el fallback carga sin error
- [ ] `matricula-banner` sigue renderizando
- [ ] Carrusel: cambiar slides no altera la altura del marco
- [ ] El README ya no contiene la regla vieja de `min-height: 90dvh` por plantilla

### Checklist de commits atómicos (definido por el plan)

- [ ] `refactor(banners): estandarizar capa externa e interna en _banner.css`
- [ ] `refactor(banners): eliminar plantilla prueba y sus dependencias`
- [ ] `docs(banners): reescribir README con contrato de dos capas y esqueleto canónico`

### Fuera de alcance

Celular horizontal (`max-height: 600px`) · preview proporcional del admin
(`anchoFigma`/`altoFigma`) · implementación de `refuerzo-1` · alineación/eliminación de
`matricula-banner` · migración de contenedores existentes (Opción A descartada).

---

## Estado de ejecución

> **Nota de agrupación de commits:** el plan define 3 commits atómicos por **fase**.
> Cada sub-paso (1.1, 1.2, …) se ejecuta y verifica en un ciclo independiente, pero el commit
> se propone al cierre de cada fase, según el checklist del propio plan.

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1.1 | Capa externa `.banner` en `_banner.css` | ✅ Completado | `20fa289` | 🟡 | `display: grid` → `flex`; añadido `height/min-height: 80vh` + `--banner-padding-total` |
| 1.2 | Capa interna `.banner__container` | ✅ Completado | `20fa289` | 🟡 | Solo restricciones: `width`/`max-width`/`max-height`/`aspect-ratio` vía variable; sin display/gap/justify |
| 1.3 | Contención de media universal | ✅ Completado | `20fa289` | 🟢 | `.banner__container :is(img, svg, video)` con techo `30dvh` y `object-fit: contain` |
| 1.4 | Mobile/Tablet + API de variables | ✅ Completado | `20fa289` | 🟠 | Bloque `@media (max-width: 1023px)`; `90dvh` congelado; reset `aspect-ratio: auto` sin `!important`; default de apilado overrideable. Las 6 variables del contrato quedan consumidas |
| 2.1 | Eliminar `prueba.css` | ✅ Completado | `9e1cf82` | 🟢 | `git rm` → queda staged como `D`; directorio queda con `_banner.css` + `matricula-banner.css` |
| 2.2 | Eliminar `BannerPrueba.astro` | ✅ Completado | `9e1cf82` | 🟢 | `git rm` → staged como `D`; `templates/` queda solo con `BannerMatriculaBanner.astro` |
| 2.3 | Limpiar `catalogo.ts` | ✅ Completado | `9e1cf82` | 🟡 | Import de `palettes` eliminado · `BANNERS_SLUGS = ["matricula-banner"]` · entrada `prueba` eliminada (124 → 94 líneas) |
| 2.4 | Eliminar `palettes.ts` + export en `index.ts` | ✅ Completado | `9e1cf82` | 🟢 | `git rm palettes.ts`; `index.ts` queda con `contratos` + `catalogo`. Sin referencias de código en el resto del repo |
| 2.5 | Quitar export en `package.json` | ✅ Completado | `9e1cf82` | 🟢 | `exports` queda con `.`, `base.css` y `matricula-banner.css`. JSON validado con `ConvertFrom-Json` |
| 2.6 | Limpiar `HomeBanner.astro` | ✅ Completado | `9e1cf82` | 🟡 | Import de `BannerPrueba.astro` y entrada `prueba` de `COMPONENTES` eliminados (31 → 29 líneas) |
| 2.7 | Reapuntar `banners.json` (fallback) | ✅ Completado | `9e1cf82` | 🟡 | Item reapuntado a `matricula-banner` con `nino-birrete.avif` (asset verificado en disco). JSON válido; conforme a `bannerSchema` |
| 2.8 | Eliminar instancia `prueba` en Supabase | ✅ Completado | — (no genera commit) | 🟡 | Ejecutado manualmente por el usuario desde el panel (confirmado en sesión). No verificable por el agente: sin acceso a la BD |
| 3.1 | Reescribir `README.md` | ✅ Completado | `f20474e` | 🟡 | Reescrito (361 → 587 líneas). Nuevas §3 *Contrato de dos capas* y §4 *Esqueleto copiable*. **Desvío aprobado:** layout desktop del esqueleto dentro de `@media (min-width: 1024px)` (ver Desvíos #2) |
| 3.2 | Actualizar `figma-prompt.md` | ✅ Completado | `f20474e` | 🟢 | Restricciones 5–9 reescritas (contrato de dos capas · 2 modos de canvas · `--banner-aspect-ratio` · breakpoints 1023/1024px · apilado mobile). Referencias muertas a `palettes.ts` y `min-height: 90dvh` eliminadas |
| 4 | Verificación (tests + checks + builds) | ✅ Completado | — (no genera commit) | 🟡 | A (4 comandos) y B (3 chequeos estáticos) verificados por el agente. C (navegador): chequeo 8 confirmado por el usuario; chequeo 9 no demostrable con los datos actuales — ver §Verificación |

---

## Registro de commits

_(Se llenará conforme avance la ejecución)_

| Fase | Hash | Mensaje | Archivos |
|------|------|---------|----------|
| 1 | `20fa289` | `refactor(banners): estandarizar capa externa e interna en _banner.css` | `packages/shared/src/banners/css/_banner.css` (+57 / −4) |
| 2 | `9e1cf82` | `refactor(banners): eliminar plantilla prueba y sus dependencias` | 8 archivos (+7 / −179) · 3 eliminaciones |
| 3 | `f20474e` | `docs(banners): reescribir README con contrato de dos capas y esqueleto canonico` | `README.md` · `figma-prompt.md` (+351 / −96) |

---

## Verificación (Fase 4)

Ejecutada el 2026-09-17 sobre `main` en `f20474e` (working tree limpio salvo `reports/` y
`docs/banner-contexto-continuacion.md`, sin trackear y fuera de alcance).

### A) Comandos — ejecutados por el agente

| # | Comando | Resultado | Evidencia |
|---|---|---|---|
| 1 | `pnpm --filter @web-modelo/shared test` | ✅ **PASA** | vitest 5.0.0 · 1 archivo · **7/7 tests** · 1.26s |
| 2 | `pnpm --filter @web-modelo/web check` | ✅ **PASA** | `astro check` + eslint + prettier + budget · **0 errores, 0 warnings**, 22 hints (deprecaciones preexistentes de `z.string().url()/email()` y `astro(4000)`) · Prettier OK · budget **217.1KB / 500KB** |
| 3 | `pnpm --filter @web-modelo/web build` | ✅ **PASA** | 18.35s · 15 rutas prerenderizadas · 15 imágenes optimizadas · adapter `@astrojs/vercel` · solo warnings preexistentes de `:global` (lightningcss, en CSS de noticias) |
| 4 | `pnpm --filter @web-modelo/admin build` | ✅ **PASA** | Next.js 16.3.3 (Turbopack) · compilado en 31.3s · TypeScript OK · 5 rutas estáticas + 20 dinámicas |

> El `build` de la web valida además el fallback del paso 2.7: sin BD configurada,
> `getBanners()` ejecuta `bannersFallbackSchema.parse(banners.json)` y el build pasa.

### B) Chequeos estáticos — ejecutados por el agente

| # | Chequeo | Resultado | Evidencia |
|---|---|---|---|
| 5 | El admin ya no ofrece `prueba` como plantilla | ✅ | `apps/admin/app/admin/banners/actions.ts:17` → `const PLANTILLAS = BANNERS_SLUGS;` (importado de `@web-modelo/shared` en línea 9). Al estrecharse `BANNERS_SLUGS` a `["matricula-banner"]`, `prueba` desaparece del selector sin tocar el admin |
| 6 | El README ya no contiene la regla vieja de `min-height: 90dvh` por plantilla | ✅ | 0 ocurrencias de `min-height: 90dvh` en `README.md` (verificado en 3.1) |
| 7 | `matricula-banner` sigue renderizando | ✅ | `BannerMatriculaBanner.astro` + `matricula-banner.css` intactos · importado en `HomeBanner.astro` · exportado en `package.json` · compila en `web build` y `admin build` |

### C) Chequeos en navegador

| # | Chequeo | Cómo | Estado |
|---|---|---|---|
| 8 | Hero en dev/local: el fallback carga sin error | `pnpm --filter @web-modelo/web dev` → el hero debe mostrar `matricula-banner` con `nino-birrete.avif` | ✅ **Confirmado por el usuario** (no verificable por el agente) |
| 9 | Carrusel: cambiar slides no altera la altura del marco | Con ≥2 banners activos, cambiar de slide y observar que la altura del hero no salta | ⚪ **No demostrable con los datos actuales** (ver nota) |

> **Nota sobre el chequeo 9:** hoy solo existe una plantilla (`matricula-banner`), que queda
> **fuera del contrato** por decisión del plan (declara su propio alto y no usa
> `.banner__container`). El marco rígido del contrato no tiene todavía consumidor real, así que
> el chequeo no es demostrable con datos actuales. El propio plan lo anticipa en Riesgos
> (*"El contrato no se puede validar visualmente… Validar con `refuerzo-1`"*). Se documenta como
> **no demostrable en este plan**, no como fallo.

---

## Incidentes y desvíos

_(Vacío al inicio. Se registra cualquier problema encontrado durante la ejecución)_

### Desvíos

1. **Paso 2.8 — ejecución manual fuera del agente (2026-09-17).** El borrado de la fila
   `plantilla_id = 'prueba'` en la tabla `banners` lo ejecutó el **usuario manualmente**
   (confirmado en sesión: *"ya eliminé prueba de supabase"*), ya que el agente no tiene acceso
   a la BD de producción. **La verificación es la confirmación del usuario, no una
   comprobación del agente.** Impacto: nulo sobre el código — la plantilla ya no está
   registrada en `COMPONENTES`.

2. **Esqueleto canónico: layout desktop dentro de `@media (min-width: 1024px)`
   (2026-09-17, Paso 3.1).** El plan especifica el esqueleto con el motor de layout desktop
   como regla suelta de `.banner--<slug> .banner__container`. Verificado que eso **anula el
   default de apilado mobile** de la base: la regla de la plantilla tiene especificidad
   (0,2,0) frente a (0,1,0) de la base, así que gana también en `max-width: 1023px`. Se
   consultó al usuario, que eligió **Opción A**: envolver el bloque desktop en
   `@media (min-width: 1024px)`. **No se modificó el CSS de Fase 1** (`20fa289`); el desvío es
   solo documental y refuerza la decisión *"default de apilado en la base, overrideable por
   plantilla"*. Añadida nota de especificidad en §3.4 y checklist en §7.

3. **Correcciones de contenido no listadas en el plan (Paso 3.1).** Al reescribir el README se
   corrigieron afirmaciones que quedaban falsas tras la Fase 2:
   - `palettes.ts` (3 menciones) → nota de "ya no existe" + patrón de archivo de tonos propio.
   - Ejemplo con `BANNERS_SLUGS = ["prueba", "tarjeta-foto"]` / `prueba: BannerPrueba` →
     `["matricula-banner", "tarjeta-foto"]` y mapa `COMPONENTES` sin `prueba`.
   - Tabla de arquitectura: `packages/shared/package.json` pasó de *"No (se usa el nombre
     real)"* a ***"Sí"***. Verificado contra el propio `package.json` (cada CSS de plantilla
     tiene entrada en `exports`; el paso 2.5 del plan existió justamente para quitarla) y
     contra `matricula-banner.css`. El README tal cual habría producido un import roto.
   - Ejemplo del `.astro` usaba `ResponsiveImage` para la foto, contradiciendo §9 del mismo
     README (*"NO uses `ResponsiveImage` para la foto del banner"*) → ahora usa
     `<img src={resolveAssetUrl(...)}>`, coherente con `BannerMatriculaBanner.astro`.

4. **`figma-prompt.md`: breakpoints alineados al contrato (Paso 3.2).** El plan solo pedía
   documentar los modos de canvas y `--banner-aspect-ratio`. Se actualizó además la restricción
   de breakpoints (`max-width: 48rem` → `1023px`; `min-width: 64rem` → `1024px`) porque el
   contrato (Fase 1) congela el marco en `≤1023px`: un prompt con `48rem` generaría plantillas
   cuyo override mobile no coincide con el marco de la base (entre 769 y 1023px quedaría el
   default de apilado). Es alineación mecánica derivada del contrato, no una decisión nueva.

### Observaciones (sin acción en este plan)

1. **`docs/banner-contexto-continuacion.md` (paso 2.4):** el checklist futuro de `refuerzo-1`
   dice *"Agregar a `palettes.ts`: tonos refuerzo-1 (default, C1, C2)"*. Tras eliminar
   `palettes.ts`, ese paso ya no aplica: la plantilla nueva deberá crear su propio archivo de
   tonos o declarar los colores en su `.css`. Documento fuera del alcance de este plan
   (sin trackear).
2. **`apps/web/src/shared/db/banners.ts` (paso 2.7):** los comentarios de las líneas 23–24 y
   94 hablan del *"fallback de prueba"* / *"el fallback de prueba para que el slider sea
   visible durante el desarrollo"*. El fallback ya no es la plantilla `prueba`, pero el
   comportamiento descrito (lista vacía si hay BD sin banners activos; fallback local si no
   hay BD) sigue siendo correcto. Solo el texto quedó desactualizado. **No se modifica**:
   `banners.ts` no está en el alcance del plan.
3. **Escalas de breakpoint coexistiendo en `_banner.css` (Fase 1):** el contrato usa
   `max-width: 1023px` para el marco, pero `.banner__content` (línea 80) y `.banner__title`
   (línea 117) siguen usando `@media (max-width: 48rem)` / `(min-width: 48rem)` — código
   preexistente. No se unificó: el plan no lo pide. Sin impacto (afectan tipografía y gap del
   contenido, no el marco).
4. **`catalogo.ts` (línea 13) conserva un comentario desactualizado:** dice que el CSS de la
   plantilla *"se importa con la ruta real, sin alias en `package.json`"*, lo que sugiere que no
   hay que tocar `package.json`. En realidad cada CSS de plantilla **sí** requiere su entrada en
   `exports`. El README ya lo documenta correctamente; el comentario del código quedó como
   estaba (archivo fuera del alcance de la Fase 3).
