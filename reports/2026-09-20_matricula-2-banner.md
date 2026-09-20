# Banner matricula-2 (Arquitectura A)

> **Creado:** 2026-09-20
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro SSG (web) + Next.js (admin) + Supabase · monorepo pnpm
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** ✅ COMPLETADO (9/9 pasos · 9 commits · verificación completa)

---

## Plan original

### Objetivo
Crear la plantilla `matricula-2` bajo el estándar **Arquitectura A** (canvas 1600×720, cqw, contrato de dos capas), consistente con `refuerzo-1`. La plantilla usa tipografía **Nerko One**, degradado de fondo según tono (rojo/azul), foto grupal con marco polaroid integrado, y CTA con keyword `whatsapp`.

### Decisiones confirmadas
| Decisión | Valor |
|---|---|
| Canvas desktop | 1600×720 |
| Canvas móvil | 800×1280 — composición apilada derivada |
| Fondo Frame 1 | Degradado según tono (rojo default / azul C1) |
| Fondo Frame 2 | Transparente |
| Tipografía | Nerko One (self-hosted, peso 400) |
| Kicker | Excluido |
| Tono C1 (Azul) | Mismos stops que rojo: 67.79% → 100% |
| Foto | ninos-grupo.avif (placeholder existe) — object-fit: contain |
| CTA | Keyword `whatsapp` |
| Z-index | fondo(0) → foto(1) → título/subtítulo(2) → CTA(3) |

### Pasos

| # | Archivo | Acción | Dificultad |
|---|---------|--------|------------|
| 1 | `apps/web/public/fonts/nerko-one/NerkoOne-Regular.woff2` | Crear — descargar woff2 latin de Google Fonts | 🟢 |
| 2 | `apps/web/src/styles/_fonts.css` | Modificar — añadir @font-face Nerko One | 🟢 |
| 3 | `packages/shared/src/banners/matricula-2-tonos.ts` | Crear — tonos + helper | 🟢 |
| 4 | `packages/shared/src/banners/index.ts` | Modificar — export tonos | 🟢 |
| 5 | `packages/shared/src/banners/catalogo.ts` | Modificar — slug + entrada completa | 🟡 |
| 6 | `packages/shared/src/banners/css/matricula-2.css` | Crear — Architecture A completo | 🟠 |
| 7 | `packages/shared/package.json` | Modificar — export CSS | 🟢 |
| 8 | `apps/web/.../templates/BannerMatricula2.astro` | Crear — markup canónico | 🟡 |
| 9 | `apps/web/.../HomeBanner/HomeBanner.astro` | Modificar — registrar componente | 🟢 |
| 10 | `apps/web/src/data/fallback/banners.json` | Modificar — item matricula-2 (orden 0) | 🟢 |
| 11 | Verificación | shared test · web check · web build · admin build | 🟡 |

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Descargar Nerko One woff2 + @font-face | ✅ Completado | `7764577` | 🟢 | woff2 18KB + @font-face en _fonts.css |
| 2 | Crear matricula-2-tonos.ts + export | ✅ Completado | `10c9b2b` | 🟢 | 2 tonos (rojo/azul) + helper |
| 3 | Actualizar catalogo.ts (slug + entrada) | ✅ Completado | `ed6f98c` | 🟡 | slug + contrato + ejemplo + anchoFigma/altoFigma |
| 4 | Crear css/matricula-2.css | ✅ Completado | `4776667` | 🟠 | Architecture A completo: desktop cqw + móvil apilado |
| 5 | Export CSS en package.json | ✅ Completado | `b598447` | 🟢 | export agregado |
| 6 | Crear BannerMatricula2.astro | ✅ Completado | `2b875da` | 🟡 | markup canónico + inline styles tono |
| 7 | Registrar en HomeBanner.astro | ✅ Completado | `e0f59be` | 🟢 | import + COMPONENTES map |
| 8 | Actualizar banners.json fallback | ✅ Completado | `cf71f3b` | 🟢 | matricula-2 orden 0, otros desplazados |
| 9 | Verificación (tests + builds) | ✅ Completado | — | 🟡 | shared test 7/7 · web check OK · web build OK · admin build OK |

---

## Registro de commits

| Fase | Hash | Mensaje | Archivos |
|------|------|---------|----------|
| 1 | `7764577` | `feat(banners): agregar fuente Nerko One para plantilla matricula-2` | `apps/web/public/fonts/nerko-one/NerkoOne-Regular.woff2` · `apps/web/src/styles/_fonts.css` |
| 2 | `10c9b2b` | `feat(banners): tonos matricula-2 (rojo/azul) + export` | `packages/shared/src/banners/matricula-2-tonos.ts` · `packages/shared/src/banners/index.ts` |
| 3 | `ed6f98c` | `feat(banners): agregar matricula-2 al catálogo (slug + contrato + ejemplo)` | `packages/shared/src/banners/catalogo.ts` |
| 4 | `4776667` | `feat(banners): CSS matricula-2 (Architecture A · canvas 1600×720 · cqw · móvil apilado)` | `packages/shared/src/banners/css/matricula-2.css` |
| 5 | `b598447` | `feat(banners): export CSS matricula-2 en package.json` | `packages/shared/package.json` |
| 6 | `2b875da` | `feat(banners): template BannerMatricula2.astro (markup canónico + inline styles)` | `apps/web/src/features/home/components/HomeBanner/templates/BannerMatricula2.astro` |
| 7 | `e0f59be` | `feat(banners): registrar BannerMatricula2 en HomeBanner.astro` | `apps/web/src/features/home/components/HomeBanner/HomeBanner.astro` |
| 8 | `cf71f3b` | `feat(banners): fallback matricula-2 en banners.json (orden 0)` | `apps/web/src/data/fallback/banners.json` |
| 9 | `9a7d24d` | `fix(banners): composicion movil de matricula-2 (sin recorte, centrado, orden foto-textos)` | `packages/shared/src/banners/css/matricula-2.css` |

---

## Incidentes y desvíos

### Verificación posterior (2026-09-20) — hallazgos y correcciones

Se auditó la implementación contra la FICHA, el contrato de Arquitectura A y el
motor `_banner.css`. El **desktop resultó fiel** (conversiones `px/16` correctas,
efectos y z-index conformes). Se detectaron **3 defectos en el bloque móvil** y
**1 archivo sin versionar**:

| # | Severidad | Hallazgo | Corrección |
|---|-----------|----------|------------|
| 1 | ALTA | `--banner-content-max-h: 35.955cqw` (raíz, sin media query) aplicaba también en móvil; el motor hace `max-height` + `overflow:hidden` sobre `.banner__content` → el subtítulo y el CTA se **recortaban** en celular | Reset `--banner-content-max-h: none` dentro del bloque móvil (patrón de `refuerzo-1.css`) |
| 2 | ALTA | La foto va **antes** que el contenido en el DOM; con flujo estático en móvil la foto quedaba **encima** de los textos (opuesto al comentario derivado) | **Decisión del usuario: Opción B** (Foto → Textos). Se conserva el orden del DOM y se documenta como el orden definitivo |
| 3 | MEDIA | `.banner__container` era `display:block` en móvil → foto a la izquierda y pila pegada arriba, con espacio vacío abajo | `.banner__container` pasa a `flex column` con `justify-content/align-items: center`; se quita `margin-top` de la foto |
| 4 | MEDIA | `apps/web/public/branding/placeholders/ninos-grupo.avif` estaba **untracked**; el ejemplo del catálogo y el fallback lo referencian y el preview del admin lo carga desde la web → 404 en deploy | Se versiona el asset (commit siguiente) |

Commit de corrección: `9a7d24d`.

> Nota: el `web build` **no valida** el fallback `banners.json` cuando hay
> `PUBLIC_SUPABASE_URL` real (consulta la BD y cae al hero si no hay banners
> activos). La validez del JSON se comprobó por inspección contra `bannerSchema`.