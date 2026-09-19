# Banner refuerzo-1 (primer banner bajo contrato de dos capas)

> **Creado:** 2026-09-18
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro SSG (web) + Next.js (admin) + Supabase · monorepo pnpm
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** ✅ COMPLETADO (12/12 pasos · 4 comandos de verificación OK)
>
> **Actualizado 2026-09-19:** el canvas se estandarizó a **1600×720** (ver
> `2026-09-18_arquitectura-a-banners-1600x720.md`) y los tonos finales son
> **azul / rojo / petróleo**. La foto se ajustó para llenar el alto del canvas
> (desktop: `height:100%` × `37.275cqw`); en móvil conserva `aspect-ratio`.

---

## Plan original

### Objetivo

Implementar `refuerzo-1` (primer banner conforme al contrato de dos capas del
`README.md` §3-4) y, antes, hacer dinámico el preview del admin para que respete
la proporción del canvas Figma de cada plantilla (`anchoFigma`/`altoFigma`).
`matricula-banner` queda como legacy (sin tocar).

### FASE 1 — Preview admin dinámico

| # | Archivo | Acción |
|---|---------|--------|
| 1.1 | `packages/shared/src/banners/catalogo.ts` | `anchoFigma?`/`altoFigma?` en `EntradaCatalogo` + helper `aspectoDePlantilla(slug)` (fallback 1280×648) |
| 1.2 | `apps/admin/app/admin/banners/banner-preview-frame.tsx` | **Nuevo**: iframe fijo 1280 escalado + recorte a la proporción del canvas |
| 1.3 | `apps/admin/app/admin/banners/banners-grid.tsx` | `Thumb` usa `BannerPreviewFrame` con la proporción del catálogo |
| 1.4 | `apps/admin/app/admin/banners/banners-form.tsx` | Modal "Ver en grande" usa `BannerPreviewFrame` (aspecto del catálogo) |

### FASE 2 — Banner refuerzo-1

| # | Archivo | Acción |
|---|---------|--------|
| 2.1 | `packages/shared/src/banners/refuerzo-1-tonos.ts` | **Nuevo**: tonos azul/rojo/petróleo + helper |
| 2.2 | `packages/shared/src/banners/index.ts` | Export del archivo de tonos |
| 2.3 | `packages/shared/src/banners/catalogo.ts` | Slug + entrada completa (contrato + ejemplo) |
| 2.4 | `packages/shared/src/banners/css/refuerzo-1.css` | **Nuevo**: contrato dos capas (1600/720) |
| 2.5 | `packages/shared/package.json` | Export `./banners/css/refuerzo-1.css` |
| 2.6 | `apps/web/.../templates/BannerRefuerzo1.astro` | **Nuevo**: markup canónico |
| 2.7 | `apps/web/.../HomeBanner/HomeBanner.astro` | Registrar en `COMPONENTES` |
| 2.8 | `apps/web/src/data/fallback/banners.json` | Item refuerzo-1 (verificación local) |

### FASE 3 — Verificación

`shared test` · `web check` · `web build` · `admin build` · visual dev + checklist README §7.

### Especificación del diseño (FICHA LEÍDA)

- Canvas **1600 × 720** (estandarizado por el trabajo de Arquitectura A; el plan inicial partía de 1600×645) · fondo `#EDEDED` · recorte de contenido activo.
- Forma azul SVG (`Rectangle 3.svg`): x 33, y 94, 1057×508, fill `#00209E`, radio 47.84.
- Foto (marco festoneado `foto-nina.avif`): x 983, y 0, 531×641; implementada como `height: 100%` (720) × `37.275cqw` (~596), `object-fit: contain`, `rotate 6.47°` (el canvas recorta las esquinas). El asset se recortó a su contenido: **1000×1247** (ratio 0.802), 103KB. `marco-foto-nina.avif` se descartó (estampa pre-rotada con padding).
- Textos: kicker Poppins 600 78.31px; título Nunito 800 176.19px; subtítulo Poppins 500 46.98px (uppercase); todos `#FFFFFF`; gap 11px; padding T/B 107, L/R 218.
- CTA: Nunito 700 55.17px, fondo `#FFFFFF`, color `#00209E`, radio 26.45px, padding 40.74/5.66, sombra 4.65 2.66 2.66 rgba(0,0,0,.25).
- Tonos: `azul #00209E` (default) · `rojo #B10F01` · `petroleo #056778` → cambian **a la vez** forma y texto del CTA.
- Capas: Frame 1 (`.banner--refuerzo-1`) fondo `#EDEDED`; Frame 2 (`.banner__container`) transparente + `overflow:hidden`.

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1.1 | `catalogo.ts`: dimensiones + helper | ✅ Completado | — | 🟡 | `anchoFigma?`/`altoFigma?` + `aspectoDePlantilla(slug)` con fallback 1280×648 |
| 1.2 | `banner-preview-frame.tsx` (nuevo) | ✅ Completado | — | 🟠 | Iframe fijo 1280 escalado; `cropH = 1280·(alto/ancho)`, `offsetY` centrado, altura = `cropH·scale` |
| 1.3 | `banners-grid.tsx`: Thumb dinámico | ✅ Completado | — | 🟡 | `Thumb` usa `BannerPreviewFrame` + `aspectoDePlantilla(banner.plantilla_id)` |
| 1.4 | `banners-form.tsx`: modal dinámico | ✅ Completado | — | 🟡 | Modal "Ver en grande" usa el mismo frame fiel; adiós al `aspect-[1280/648]` |
| 2.1 | `refuerzo-1-tonos.ts` | ✅ Completado | — | 🟢 | azul `#00209e` · rojo `#b10f01` · petroleo `#056778` + `tonoRefuerzo1PorKey` |
| 2.2 | `index.ts` export | ✅ Completado | — | 🟢 | — |
| 2.3 | `catalogo.ts` entrada completa | ✅ Completado | — | 🟡 | `BANNERS_SLUGS` + entrada con 1600×720, contrato y ejemplo |
| 2.4 | `css/refuerzo-1.css` | ✅ Completado | — | 🟠 | Dos capas; desktop con `cqw`; mobile apilado; `rotate(var(--banner-foto-rotacion,0deg))` |
| 2.5 | `package.json` export | ✅ Completado | — | 🟢 | — |
| 2.6 | `BannerRefuerzo1.astro` | ✅ Completado | — | 🟡 | Markup canónico + shape SVG inline + `resolveAssetUrl` + tono inline |
| 2.7 | `HomeBanner.astro` registro | ✅ Completado | — | 🟢 | — |
| 2.8 | `banners.json` fallback | ✅ Completado | — | 🟢 | refuerzo-1 orden 0, matricula orden 1 |
| 3 | Verificación | ✅ Completado | — | 🟡 | 4 comandos OK (ver §Verificación) |

---

## Registro de commits

Ejecutados el 2026-09-19.

| # | Hash | Mensaje | Archivos |
|---|------|---------|----------|
| 1 | `735ddad` | `feat(banners): canvas escalado (Arquitectura A) y plantilla refuerzo-1` | `_banner.css` · `matricula-banner.css` · `refuerzo-1.css` · `refuerzo-1-tonos.ts` · `index.ts` · `catalogo.ts` · `package.json` · `README.md` · `figma-prompt.md` · `BannerRefuerzo1.astro` · `BannerMatriculaBanner.astro` · `HomeBanner.astro` · `BannerActions.astro` · `banners.json` · `foto-nina.avif` |
| 2 | `80e5146` | `feat(admin): preview de banners proporcional al canvas Figma` | `banner-preview-frame.tsx` · `banners-grid.tsx` · `banners-form.tsx` |
| 3 | `875f8b2` | `style(home): ajustar padding del trustStrip y controles del slider` | `index.astro` · `BannerSlider.css` |
| 4 | `eaee32b` | `docs(banners): reportes de arquitectura A y refuerzo-1` | `reports/*.md` |

---

## Verificación (FASE 3)

Ejecutada el 2026-09-18.

| # | Comando | Resultado | Evidencia |
|---|---------|-----------|-----------|
| 1 | `pnpm --filter @web-modelo/shared test` | ✅ **PASA** | vitest 5.0.0 · **7/7 tests** · 1.29s |
| 2 | `pnpm --filter @web-modelo/web check` | ✅ **PASA** | `astro check` 0 errores / 0 warnings / 22 hints preexistentes · eslint OK · prettier OK · budget **217.1KB / 500KB** |
| 3 | `pnpm --filter @web-modelo/web build` | ✅ **PASA** | 17.74s · 15 rutas prerenderizadas · 15 imágenes · adapter `@astrojs/vercel` · solo warnings preexistentes de `:global` (noticias) |
| 4 | `pnpm --filter @web-modelo/admin build` | ✅ **PASA** | Next.js 16.3.3 (Turbopack) · compilado 39.1s · TypeScript OK · 5 estáticas + 20 dinámicas |

> El `web build` valida además el fallback: `bannersFallbackSchema.parse(banners.json)`
> acepta el nuevo item `refuerzo-1` (enum de `BANNERS_SLUGS` ya lo incluye).

---

## Incidentes y desvíos

1. **Prettier reformateó `BannerRefuerzo1.astro`** (`<path ... />` → `<path ...></path>`) en la primera pasada de `web check`. Se corrigió con `prettier --write`; el segundo `check` quedó en verde.

### Decisiones aplicadas (confirmadas por el usuario)

- **Modal del admin**: iframe escalado fiel (ancho fijo 1280 + recorte a la proporción del canvas), en vez de un `aspect-ratio` literal que comprimiría el diseño por el marco de 80vh.
- **Rotación de la foto**: la FICHA indicaba 169.79° (casi 180°); se trata como **0°** mediante `--banner-foto-rotacion` (ajustable a `-10.2deg` si se quiere el giro leve).
- **Fallback local**: `refuerzo-1` añadido a `banners.json` para verlo en `web dev` sin Supabase.
- **Fondos**: Frame 1 (`.banner--refuerzo-1`) = `#EDEDED`; Frame 2 (`.banner__container`) = transparente + `overflow: hidden`.

### Observaciones (sin acción)

- El preview inline pequeño del form (no el modal) sigue mostrando el layout mobile por su ancho (~500px) y conserva el `.banner-preview` de `globals.css`. No estaba en el alcance solicitado.
- `matricula-banner` queda intacta como legacy; hereda el fallback 1280×648 en el preview.
- **Verificación estática del build**: `apps/web/dist/client/index.html` incluye el CSS de `refuerzo-1` inline (`container-type`, `11.0119cqw`, `1600 / 645`), pero **no** el markup del banner: `apps/web/.env` tiene un `PUBLIC_SUPABASE_URL` real, así que `getBanners()` consultó la BD y no había banners activos → cayó al `HomeHero`. Para ver `refuerzo-1` en el hero hay que **crear el banner en el admin** (plantilla "Refuerzo-1"), que dispara el rebuild. El fallback (`banners.json`) solo aplica cuando no hay BD configurada.
