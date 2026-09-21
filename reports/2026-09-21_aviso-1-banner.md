# Banner aviso-1 (Arquitectura A)

> **Creado:** 2026-09-21
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro SSG (web) + Next.js (admin) + Supabase · monorepo pnpm
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** ✅ COMPLETADO (9 commits · verificación completa)

---

## Plan original

### Objetivo
Crear la plantilla `aviso-1` bajo el estándar **Arquitectura A** (canvas 1600×720,
`cqw`, contrato de dos capas), consistente con `matricula-2` y `refuerzo-1`.
Fondo full-bleed con foto (Frame 1) y Frame 2 transparente; forma blanca orgánica
(`rectangulo-2.svg`), título en **Gluten** 500, foto del profesor con marco
rotado y CTA en **Nerko One**.

### Decisiones confirmadas
| Decisión | Valor |
|---|---|
| Canvas desktop | 1600×720 (estándar del repo, sin cambios) |
| Canvas móvil | 800×1280 — apilado derivado (similar a refuerzo-1) |
| Frame 1 (externo) | Foto full-bleed (`background`, cover) — NO color sólido |
| Frame 2 (interno) | Transparente |
| Forma | `rectangulo-2.svg` inline (1331×556), fill `#FFFFFF` fijo |
| Tonos | `azul #00379D` (default) · `rojo #B20003` → título + fondo CTA |
| Tipografía título | Gluten 500 (self-hosted, nuevo) |
| CTA | Nerko One 400 · href `/formulario` |
| Kicker / subtítulo | No existen → fuera del contrato |
| Líneas de título | 4 (`--banner-title-lineas: 4`) |
| Sombra foto | Sobre la `<img>` (`drop-shadow(-0.5cqw -0.5cqw 0.125cqw`) |
| Z-index | fondo(0) → forma(1) → foto(2) → título(3) → CTA(4) |

### Pasos

| # | Archivo | Acción | Dificultad |
|---|---------|--------|------------|
| 1 | `apps/web/public/fonts/gluten/GlutenVariable.woff2` + `_fonts.css` | Crear/Modificar — woff2 + @font-face | 🟢 |
| 2 | `packages/shared/src/banners/aviso-1-tonos.ts` + `index.ts` | Crear/Modificar — tonos + export | 🟢 |
| 3 | `packages/shared/src/banners/catalogo.ts` | Modificar — slug + entrada completa | 🟡 |
| 4 | `packages/shared/src/banners/css/aviso-1.css` | Crear — Arquitectura A completo | 🟠 |
| 5 | `packages/shared/package.json` | Modificar — export CSS | 🟢 |
| 6 | `apps/web/.../templates/BannerAviso1.astro` | Crear — markup canónico + SVG inline | 🟡 |
| 7 | `apps/web/.../HomeBanner/HomeBanner.astro` | Modificar — registrar componente | 🟢 |
| 8 | `apps/web/public/branding/placeholders/*` | Versionar — fondo, foto y forma (untracked) | 🟢 |
| 9 | `apps/web/src/data/fallback/banners.json` | Modificar — item aviso-1 (orden 0) | 🟢 |
| 10 | Verificación | shared test · web check · web build · admin build · render | 🟡 |

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Fuente Gluten + @font-face | ✅ Completado | `b5ffeb5` | 🟢 | woff2 49KB (latin) + @font-face 100–900 |
| 2 | `aviso-1-tonos.ts` + export | ✅ Completado | `125f648` | 🟢 | 2 tonos (azul/rojo) + helper |
| 3 | `catalogo.ts` (slug + entrada) | ✅ Completado | `c83d79b` | 🟡 | contrato + ejemplo + 1600×720 |
| 4 | `css/aviso-1.css` | ✅ Completado | `7a88aae` | 🟠 | desktop cqw + móvil apilado |
| 5 | Export CSS en package.json | ✅ Completado | `6281007` | 🟢 | — |
| 6 | `BannerAviso1.astro` | ✅ Completado | `2fd987f` | 🟡 | SVG inline + tono inline + `resolveAssetUrl` |
| 7 | Registrar en HomeBanner.astro | ✅ Completado | `f4e1e52` | 🟢 | import + COMPONENTES map |
| 8 | Versionar assets untracked | ✅ Completado | `d14885f` | 🟢 | fondocuadriculado, profe-ensenando, rectangulo-2 |
| 9 | Fallback banners.json | ✅ Completado | `84a04f6` | 🟢 | aviso-1 orden 0, otros desplazados |
| 10 | Verificación | ✅ Completado | — | 🟡 | ver §Verificación |

---

## Registro de commits

| # | Hash | Mensaje | Archivos |
|---|------|---------|----------|
| 1 | `b5ffeb5` | `feat(banners): agregar fuente Gluten para plantilla aviso-1` | `apps/web/public/fonts/gluten/GlutenVariable.woff2` · `apps/web/src/styles/_fonts.css` |
| 2 | `125f648` | `feat(banners): tonos aviso-1 (azul/rojo) + export` | `packages/shared/src/banners/aviso-1-tonos.ts` · `packages/shared/src/banners/index.ts` |
| 3 | `c83d79b` | `feat(banners): agregar aviso-1 al catálogo (slug + contrato + ejemplo)` | `packages/shared/src/banners/catalogo.ts` |
| 4 | `7a88aae` | `feat(banners): CSS aviso-1 (Architecture A · canvas 1600×720 · cqw · móvil apilado)` | `packages/shared/src/banners/css/aviso-1.css` |
| 5 | `6281007` | `feat(banners): export CSS aviso-1 en package.json` | `packages/shared/package.json` |
| 6 | `2fd987f` | `feat(banners): template BannerAviso1.astro (markup canónico + SVG + tono)` | `apps/web/.../templates/BannerAviso1.astro` |
| 7 | `f4e1e52` | `feat(banners): registrar BannerAviso1 en HomeBanner.astro` | `apps/web/.../HomeBanner/HomeBanner.astro` |
| 8 | `d14885f` | `chore(banners): versionar assets de aviso-1 (fondo, foto, forma)` | `apps/web/public/branding/placeholders/{fondocuadriculado,profe-ensenando}.avif` · `rectangulo-2.svg` |
| 9 | `84a04f6` | `feat(banners): fallback aviso-1 en banners.json (orden 0)` | `apps/web/src/data/fallback/banners.json` |

---

## Verificación

| # | Comando | Resultado | Evidencia |
|---|---------|-----------|-----------|
| 1 | `pnpm --filter @web-modelo/shared test` | ✅ **PASA** | vitest 5.0.0 · **7/7 tests** · 1.40s |
| 2 | `pnpm --filter @web-modelo/web check` | ✅ **PASA** | 0 errores / 0 warnings / 22 hints preexistentes · Prettier OK · budget **217.1KB / 500KB** |
| 3 | `pnpm --filter @web-modelo/web build` | ✅ **PASA** | 19.06s · 15 rutas prerenderizadas · adapter `@astrojs/vercel` · warnings preexistentes de `:global` (noticias) |
| 4 | `pnpm --filter @web-modelo/admin build` | ✅ **PASA** | Next.js 16.3.3 (Turbopack) · compilado 30.3s · TypeScript OK |
| 5 | Render headless (Chrome) desktop + móvil | ✅ **PASA** | título en **4 líneas**, sin recorte ni desborde |

### Verificación de recorte del título (prometida)
El bloque de contenido mide 444.29px y está dimensionado para 4 líneas + CTA:

| Elemento | Alto |
|---|---|
| Título 4 líneas × lh 80px | 320px |
| Gap | 44.77px |
| CTA | 78.29px |
| **Total** | **443.06px ≈ 444.29px** ✓ |

Medición real en Chrome headless:
- **Desktop (1600):** 4 líneas, `scrollWidth = clientWidth` (sin overflow).
- **Móvil (390px vía iframe):** `title w=315 = scrollWidth 315`, `h=138px = 4 × 34.5px` → 4 líneas exactas, sin recorte.

> El primer screenshot móvil a 400px mostró el título cortado: **artefacto** de Chrome headless, que fuerza un viewport mínimo de 500px (el `vw` medido era 500). Re-medido a 390px reales, el título entra sin problema.

---

## Incidentes y desvíos

1. **Assets untracked (resuelto):** `fondocuadriculado.avif`, `profe-ensenando.avif`
   y `rectangulo-2.svg` existían en disco pero sin `git add`. Se versionaron en el
   commit `d14885f` (mismo riesgo que el incidente #4 de matricula-2 → 404 en deploy).
2. **Chrome headless viewport mínimo:** el screenshot a `--window-size=400` renderiza
   a 500px y recorta la captura; no es un defecto del layout. Se validó con iframe de
   390px y medición DOM (`scrollWidth == clientWidth`).
3. **Móvil derivado (sin frame Figma):** el apilado (panel blanco → título → CTA →
   foto) se deriva de `refuerzo-1`. Pendiente de alinear al pixel cuando el usuario
   provea el frame móvil de Figma (mismo criterio que refuerzo-1).
4. **Páginas temporales de verificación:** `aviso-preview.astro` y `aviso-frame.astro`
   se usaron solo para el render headless y se eliminaron (no se commitean).

### Observaciones (sin acción)
- El build estático no incluye el markup del banner (hay `PUBLIC_SUPABASE_URL` real
  → `getBanners()` consulta la BD y cae al `HomeHero` si no hay banners activos).
  El CSS de `aviso-1` sí queda en el bundle (`banner--aviso-1`, `Gluten`,
  `fondocuadriculado`). Para verlo en el hero hay que crear el banner en el admin
  (plantilla "Aviso 1"), que dispara el rebuild.
- `--banner-content-max-h: none` + `--banner-title-lineas: 4`: la contención la hace
  el `line-clamp` del título; el CTA queda a salvo de recortes.
