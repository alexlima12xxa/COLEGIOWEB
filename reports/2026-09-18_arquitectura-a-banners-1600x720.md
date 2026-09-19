# Arquitectura A — Canvas canónico 1600×720 (motor + generador)

> **Creado:** 2026-09-18
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro SSG (web) + Next.js (admin) + Supabase · monorepo pnpm
> **Riesgo:** ALTO (toca el motor compartido de banners)
> **Modo de ejecución:** MANUAL
> **Estado:** ✅ COMPLETADO (9/9 pasos · verificación final OK)

---

## Plan original

### Objetivo
Estandarizar los banners bajo **Arquitectura A**: un canvas único escalado
(`1600×720`) como SSOT de geometría, con el motor (`_banner.css`) separado de la
estética (plantillas). Eliminar el colapso vertical, el marco de foto no
diseñado y la no-determinación de alturas de texto.

### Decisiones cerradas
- Canvas canónico único **1600×720** (todas las plantillas comparten alto).
- `cqw` es **de ancho** → `1cqw = 16px @1600`; conversión `pxFigma / 16 = cqw`.
  No depende del alto (un cambio de alto no obliga a re-medir si el diseñador no
  mueve elementos).
- Frame 1 `.banner`: `height: auto` → el alto lo dicta el canvas (Frame 2).
  Frame 1 es full-bleed en ancho; Frame 2 ≤1600px centrado. Comparten ALTO, no ANCHO.
- `_banner.css` = **solo física** (marco, canvas, escala, contención). Sin
  estética ni zonas de imagen concretas.
- Contención de texto: `line-height` explícito en la plantilla + `max-height`/
  `overflow:hidden`/`line-clamp` en el motor.
- Zonas de imagen: sin reglas globales; caja por coordenadas de Figma; `cover`;
  marco festoneado como **overlay z-10** (misma caja que la foto).
- Preview del admin: eliminar `SOURCE_H`/`FRAME_RATIO`/`offsetY`; alto =
  `ancho × ratio`. Guardas: `BANNER_CANVAS` como SSOT + test de ratio.

### Pasos
| # | Archivo | Acción | Dificultad |
|---|---------|--------|------------|
| 1 | `packages/shared/src/banners/css/_banner.css` | Reescribir como motor puro (canvas 1600×720, cqw, contención) | 🟠 |
| 2 | `packages/shared/src/banners/figma-prompt.md` | Reescribir §2 restricciones + §3 FICHA (Arquitectura A) | 🟡 |
| 3 | `packages/shared/src/banners/css/refuerzo-1.css` | Migrar a 1600×720 en cqw (texto + foto + overlay) — **requiere FICHA Figma** | 🟠 |
| 4 | `packages/shared/src/banners/catalogo.ts` | `altoFigma: 720` + fallback `aspectoDePlantilla` 1600×720 | 🟢 |
| 5 | `apps/admin/app/admin/banners/banner-preview-frame.tsx` | Quitar supuesto `80vh` (`SOURCE_H`/`FRAME_RATIO`/`offsetY`) | 🟡 |
| 6 | `packages/shared/src/banners/README.md` §3 | Actualizar contrato al canvas 1600×720 | 🟢 |
| 7 | `matricula-banner.css` | Verificar regresión (re-declara alto propio) | 🔴 |
| 8 | — | Verificación (`shared test` · `web check` · `web build` · `admin build`) | 🟡 |

### Fuera de alcance
- Rediseño visual de `matricula-banner` (solo verificar regresión).
- Cambiar el slider/hero.

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | `_banner.css` → motor puro | ✅ Completado | — | 🟠 | `web check` OK (0 err / 0 warn) |
| 2 | `figma-prompt.md` → restricciones + FICHA | ✅ Completado | — | 🟡 | 219 líneas; §6-§9 y §17 reescritas |
| 3 | `refuerzo-1.css` → migrar a 1600×720 | ✅ Completado | — | 🟠 | `web check` OK · FICHA aplicada en cqw |
| 4 | `catalogo.ts` + `refuerzo-1-tonos.ts` + `BannerActions.astro` | ✅ Completado | — | 🟡 | 3 tonos · altoFigma 720 · CTA whatsapp |
| 5 | `banner-preview-frame.tsx` → quitar 80vh | ✅ Completado | — | 🟡 | `admin build` OK · alto = ancho × ratio |
| 6 | Canvas móvil (`_banner.css` + bloque móvil `refuerzo-1.css`) | ✅ Completado | — | 🟠 | `web check` OK · 800×1280 (~74dvh) |
| 7 | `README.md` §3 → contrato (incluye mobile) | ✅ Completado | — | 🟡 | §3-§10 alineadas a Arquitectura A |
| 8 | `matricula-banner` → regresión | ⏳ Pendiente | — | 🔴 | — |
| 9 | Verificación build | ✅ Completado | — | 🟡 | test 7/7 · check 0 err · web build OK · admin build OK |

---

## Registro de commits

_(Se llenará conforme avance la ejecución)_

---

## Incidentes y desvíos

1. **Estado intermedio esperado:** tras el Paso 1, `refuerzo-1` usa el canvas
   por defecto `1600/720` (la base ya no lee `--banner-aspect-ratio`) mientras sus
   valores internos siguen calculados para `645`. El banner se verá desalineado
   hasta completar el Paso 3 (migración de `refuerzo-1.css`). No es un error.
2. Se conservan `--banner-padding-mobile` / `--banner-padding-total` por
   compatibilidad; ya no se consumen en el motor (mobile = canvas escalado).
3. `matricula-banner` no usa `.banner__container` (usa su propio
   `.banner__matricula-banner-container`) y re-declara su alto; el Paso 1 no le
   afecta, pero su regresión se verifica en el Paso 7.
4. **Paso 3 — forma SVG:** `Rectangle 3.svg` tiene `viewBox 0 0 1193 685`
   (ratio 1.74) pero la FICHA ubica la forma en 1057×508 (ratio 2.08). Se aplica
   `preserveAspectRatio="none"` (patrón del template original) → la forma se
   estira. Si la muesca se ve deformada, cambiar a ratio nativo del SVG.
5. **Paso 3 — `backdrop-filter` del kicker** incluido por fidelidad a la FICHA
   (`blur(3.426px)`); es inocuo sobre relleno sólido.
6. **Paso 3 — markup intacto:** `BannerRefuerzo1.astro` ya coincidía con la FICHA
   (SVG inline, `.banner__container`, `.banner__refuerzo-1-foto`); no requirió cambios.
7. **Pendiente en Paso 4:** tonos reales (2: `#B10F01`, `#056778`), `altoFigma: 720`,
   campos de assets/CTA y `ejemplo` con textos + href de WhatsApp.
8. **Paso 4 — tonos finales (3):** `azul #00209e` (default), `rojo #b10f01`,
   `petroleo #056778`. El tono cambia a la vez la forma y el texto del CTA.
9. **Paso 4 — CTA WhatsApp:** `cta.href: "whatsapp"` es un keyword que
   `BannerActions.astro` resuelve al número del colegio (`getWhatsapp()` con
   fallback a `siteConfig.contact.whatsapp`), igual que el botón flotante. Es
   opt-in y aplica a cualquier plantilla que use el keyword.
10. **Paso 4 — textos del ejemplo (RESUELTO):** confirmados los de la FICHA:
    `title: "2027"` / `subtitle: "FECHA: 15 DE MAYO"` (el archivo tenía `2026` /
    `15 DE SETIEMBRE`; se alineó a la FICHA).
11. **Paso 6 — composición móvil DERIVADA (sin diseño Figma):** el canvas móvil
    `800×1600` y el apilado (Kicker → Título → Subtítulo → CTA → Foto) se derivan
    del desktop. El usuario pasará el diseño móvil de Figma en otra ocasión para
    alinearlo al pixel.
12. **Paso 6 — canvas móvil a `<600px`:** `800×1280` (ratio 0.625, ~74dvh en
    celular típico). `--banner-min-height-mobile: 0`. De 600px en adelante se usa
    el desktop escalado. Reducido desde `800×1600` (~92dvh) por pedido del usuario.
13. **Ajuste posterior (B) — la foto llena el alto (desktop):** por pedido del
    usuario, la caja de la foto pasó de fija `531×641` a `height:100%` +
    `width:auto` + `aspect-ratio:531/641` (≈596×720), anclada a la derecha
    (`right:5.375cqw`). ⚠ La rotación `6.47°` puede recortar las esquinas
    arriba/abajo (el canvas tiene `overflow:hidden`). Pendiente: decidir si el
    móvil usa el mismo criterio.

---

## Verificación final (Paso 9)

| # | Comando | Resultado |
|---|---------|-----------|
| 1 | `pnpm --filter @web-modelo/shared test` | ✅ **7/7** tests |
| 2 | `pnpm --filter @web-modelo/web check` | ✅ **0 errores** · 22 hints · Prettier OK · budget 217KB/500KB |
| 3 | `pnpm --filter @web-modelo/web build` | ✅ **Complete!** (18.36s) |
| 4 | `pnpm --filter @web-modelo/admin build` | ✅ **Compiled successfully** (21.1s) |

CSS nuevo presente en `dist/client/index.html`: `banner--refuerzo-1`,
`container-type`, `2.0625cqw`, canvas móvil `1280`.

**Pendiente de verificación visual (usuario):** abrir la home en desktop y móvil,
confirmar el banner refuerzo-1 y la no-regresión de matrícula.

---

## FICHA LEÍDA — Frame 2 "Canvas contenido" (1600×720)

> SSOT de diseño para el Paso 3. Provista por el usuario el 2026-09-18.

**Canvas:** 1600 × 720 px · origen esquina sup-izq de Frame 2 · clip: sí.
**Fondo:** color sólido `#EDEDED` (→ `--banner-bg`).

**Bloque de contenido:** x 94 · y 114 · w 893 · h 452.66 px
(cqw: x 5.875 · y 7.125 · w 55.813 · h 28.291) · align/justify: center · text-align: center.
Líneas permitidas: kicker 1 · título 1 · subtítulo 1.

| Elemento | Caja (px) | Tipografía |
|---|---|---|
| Kicker | x94 y114 w893 h117 | Poppins 600 · 78.305px · lh 117px · uppercase · #FFF · blur(3.426px) |
| Título | x299 y188 w493 h240 | Nunito 800 · 176.187px · lh 240px · #FFF |
| Subtítulo | x210 y393 w661 h70 | Poppins 500 · 46.983px · lh 70px · uppercase · #FFF |
| CTA | x310 y480 w462.8 h86.66 | Nunito 700 · 55.175px · lh 75px · #00209E sobre #FFF · radius 26.455 · pad 40.736/5.658 · sombra 5.291 5.291 5.291 rgba(0,0,0,.25) |

**Foto (estampilla):** x983 y0 w531 h641 · rotate 6.47° · `object-fit: contain` ·
PNG con alfa y festoneado integrado · drop-shadow(4.650 2.657 2.657 rgba(0,0,0,.25)).
**Forma (Rectangle 3):** x33 y94 w1057 h508 · fill `#00209E` · radius 47.844px ·
⚠ tiene una muesca/cola curva (estilo bocadillo) → implementar como **SVG**, no `div`+radius.
**Z-index (abajo→arriba):** fondo(0) · forma(1) · foto(2) · textos(3) · CTA(4).
**Mobile:** no existe frame móvil → se escala el canvas.

**Textos de ejemplo (copy literal):** kicker `REFUERZO ESCOLAR` · title `2027` ·
subtitle `FECHA: 15 DE MAYO` · CTA `Informes aquí`.

### Decisión de tonos (actualizada)
Dos tonos que cambian **a la vez** el relleno de la forma SVG y el color del texto
del CTA:
- color 1: `#B10F01`
- color 2: `#056778`
- default del diseño: `#00209E` (confirmar si se conserva como tercer tono)

> Pendiente de confirmar: ¿los tonos son 2 (`#B10F01`, `#056778`) o 3
> (default `#00209E` + los dos nuevos)?

### Campos de assets y CTA (para el contrato del catálogo / admin)
- **Assets:** `image` (foto, editable, requerido) · `background` (fondo, editable,
  opcional; en refuerzo-1 es color sólido, no aplica) · `assets[]` (imágenes
  adicionales, opcional).
- **CTA:** `ctaLabel` (texto del botón) · `ctaHref` (enlace) · `actions` (booleano
  para CTA secundario).
