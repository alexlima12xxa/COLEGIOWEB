# Verificación de optimización de imágenes — estado corregido

> Actualizado tras verificación contra el código real (2026-09-10).
> Corrige dos afirmaciones de la versión anterior: el preload de LCP **ya está
> implementado** y el script `sharp` de placeholders **ya existe parcialmente**.
> Las brechas de assets locales (placeholders + SVG + presupuesto) **ya están
> resueltas** con scripts in-place; ver "Recomendaciones (estado final)".

## Estado actual: OPTIMIZADO (assets locales vía scripts)

Las imágenes remotas (Supabase Storage) se optimizan en build-time vía
`astro:assets` (AVIF/WebP + srcset responsivo). Las imágenes locales en
`/public/branding/` se recomprimen **in-place** con scripts (`sharp` + SVGO),
no vía `astro:assets`; se sirven sin `srcset` (solo `<img>` nativo).

## Arquitectura actual

| Tipo de imagen | Origen | Optimización | Formato salida | Responsive |
|---|---|---|---|---|
| Noticias, banners, galería | Supabase Storage (media bucket) | ✅ Build-time (astro:assets) | AVIF + WebP + JPEG fallback | ✅ widths [480,768,1200] |
| Logo, favicon, OG, hero, placeholders | `/public/branding/<slug>/` | ⚠️ Scripts in-place (sharp/SVGO), no astro:assets | JPG recompressed · SVG minificado | ❌ Solo `<img>` nativo |
| Contenido editorial (JSONB) | Mixto | Según origen | Según origen | Según componente |

## Puntos fuertes (ya implementados)

- **Pipeline build-time para remotas**: `astro.config.ts` restringe
  `remotePatterns` a `*.supabase.co` → `astro:assets` descarga, convierte a
  AVIF/WebP y genera `srcset` multi-ancho en build.
- **Componentes unificados**: `ResponsiveImage` + `ContentImage` detectan
  origen (`isRemote`) y delegan correctamente.
- **Priorización LCP**: props `loading`, `fetchpriority`, `decoding` expuestas
  y usadas en componentes críticos (Hero, LevelCards, NewsHero, nosotros,
  NivelLayout).
- **Preload de LCP**: ✅ **ya implementado** en
  `apps/web/src/pages/index.astro:119-125`. Se inyecta
  `<link rel="preload" as="image" fetchpriority="high">` con la URL del LCP
  real (`lcpImage`), que detecta banners activos
  (`bannerLcp ?? heroPhoto/tourPoster`) (`index.astro:81-88`). También hay
  preload en `noticias/[slug].astro:112` y preload de fuentes en
  `BaseLayout.astro:31`.
- **Validación de accesibilidad remota**: `ContentImage` y `ensureAccessibleImage`
  hacen HEAD en build-time; si falla, degradan a placeholder (evita CLS + imagen rota).
- **Bucket Storage configurado**: 10MB límite, MIME permite `image/avif`, `image/webp`.
- **Hero photo en AVIF**: `hero-photo.avif` (25.9KB) generado por
  `scripts/optimize-images.mjs`.

## Brechas críticas (riesgo de rendimiento)

| Brecha | Impacto | Estado |
|---|---|---|
| Assets de marca sin optimizar (salvo hero) | LCP/FCP en móvil | ✅ Resuelto: SVGO + recompresión de placeholders |
| Placeholders JPG pesados | CLS + peso página | ✅ Resuelto: 1130KB → 746KB (-384KB) |
| No hay presupuesto de imágenes | Sin guardrails | ✅ Resuelto: `check:budget` integrado en `check` |
| SVG sin optimizar | Peso innecesario | ✅ Resuelto: 13.8KB → 8.2KB con SVGO |

## Recomendaciones priorizadas (estado final)

### 1. Crítico — Optimizar placeholders locales ✅
`scripts/optimize-images.mjs` recomprime **en sitio** (misma ruta, cero cambios
de referencias) con sharp + mozjpeg: `hero-photo.jpg`, `hero-tour-poster.jpg`,
`level-*.jpg`, `gallery-*.jpg`, `authority-*.jpg`, `about-campus.jpg`, y
regenera `hero-photo.avif` (LCP). Resultado: **1130KB → 746KB (-384KB)**.

### 2. Alto — Presupuesto de imágenes en CI ✅
`scripts/check-image-budget.mjs` (post-build) parsea `dist/client/index.html`,
mide el LCP (preload) + las 3 primeras imágenes locales y falla si el total
supera `BUDGET_KB` (default 500KB móvil). Integrado al final de `check`
(se omite si no hay `dist/`). Verificado: 218.8KB < 500KB.

### 3. Medio — Optimización SVG ✅
`scripts/optimize-svg.mjs` ejecuta SVGO (v4) in-place sobre `logo.svg`,
`logo-inverse.svg`, `favicon.svg`, `og-image.svg`. `viewBox` preservado.
Resultado: **13.8KB → 8.2KB**.

### 4. Bajo — Formato de subida en panel admin ✅ (doc)
Documentado en `docs/contrato-contenido.md` §8: "JPG/PNG ≤2MB; el build
convierte a AVIF/WebP". Validación MIME/tamaño en edge function queda como
pendiente de fase 2.

### ~~Alto — Inyectar preload de LCP~~
~~Ya implementado~~ (ver "Puntos fuertes"). No es una brecha abierta.

## Pendientes / siguientes pasos (opcionales)

- Variantes AVIF/WebP **responsive** para placeholders locales (requiere migrar
  los `<img>` nativos de `ResponsiveImage`/`ContentImage` a `<picture>`).
- Validación de MIME + tamaño en la edge function de subida (fase 2 panel admin).
- Considerar `preload`/`<link>` para fuentes ya existe en `BaseLayout.astro`.