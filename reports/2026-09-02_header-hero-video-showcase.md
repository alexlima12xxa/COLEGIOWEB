# Header + Hero Section con showcase de video interactivo

> **Creado:** 2026-09-02
> **Proyecto:** WEB-MODELO-1 (Colegio Marco Polo / white-label multi-colegio)
> **Stack:** Astro 7.2.9 (SSG) · Tailwind v4 · Supabase multi-tenant · @lucide/astro
> **Riesgo:** MEDIO (cambia el hero de portada, LCP y tipografía global)
> **Modo de ejecución:** MANUAL
> **Estado:** [✓] COMPLETADO

---

## Plan original

### Design Read
Landing hero de colegio (trust-first, audiencia: padres/familias), lenguaje moderno-educativo con toque premium pero contenido, apoyado en el sistema de tokens existente + motion CSS puro. Dials: VARIANCE 5, MOTION 4, DENSITY 3.

### Mapeo de tokens propuesta → tokens existentes (sin colores crudos)
| Propuesta | Token existente |
|---|---|
| Slate-50 #F8FAFC | `--color-surface-muted` |
| Blanco #FFFFFF | `--color-surface` |
| Slate-900 #0F172A | `--color-text` / `--color-surface-inverse` |
| Slate-600 #475569 (4.5:1) | `--color-text-muted` |
| Royal #1D4ED8 / hover #1E40AF | `--color-primary` / `--color-primary-hover` |
| Emerald-50/800 + punto verde | `--color-success-soft` / `--color-success` |

### Decisiones del usuario (2026-09-02)
1. **Tipografía:** Añadir Outfit self-hosted para `--font-display` (títulos). Afecta todos los headings del sitio.
2. **Contenedor de video único y condicional:**
   - Foto + Video → `heroPhoto` como póster con botón Play encima.
   - Solo Foto → `heroPhoto` limpia (sin Play).
   - Solo Video → video/póster del tour con Play.
   - El campo `heroPhoto` del admin se sigue usando al 100%.
3. **CTA secundario:** "Conocer propuesta ↓" con scroll suave a la sección de niveles (`#niveles`).

### Cambios planificados
1. **Tipografía Outfit**: `public/fonts/outfit/OutfitVariable.woff2` + @font-face en `_fonts.css` (con fallback calibrado anti-CLS) + `--font-display` en `_tokens.css` + `branding.fonts.display` en `colegio-piloto.ts`.
2. **Componente modular** `src/features/home/components/HomeHero/HomeHero.astro` + `HomeHero.css`:
   - Grid 55/45 (stack en móvil).
   - Contenedor Bento único condicional (3 modos según admin).
   - Badge success con punto pulsante CSS (sin emoji).
   - H1 = slogan (admin-editable), párrafo = description, CTAs = `admissions.ctaLabel/ctaUrl` + "Conocer propuesta ↓" (`ArrowDown` lucide) → `#niveles`.
   - Animación staggered de carga (CSS keyframes, gated por `prefers-reduced-motion`).
3. **VideoModal → play button glass**: círculo flotante central con `backdrop-blur`, anillo `ping`, hover `scale(1.1)`, zoom del poster `scale(1.05)`.
4. **Navbar**: animación de entrada (fade + drop) + botón Intranet a `variant="secondary"`.
5. **index.astro**: sustituir hero inline por `<HomeHero>`, limpiar estilos `homeHero__*`, añadir `id="niveles"`, `scroll-behavior: smooth` gated, preload del poster (LCP).
6. **Admin/Supabase**: sin cambios de schema ni de panel.

### Verificación
`pnpm --filter @web-modelo/web check` → `pnpm --filter @web-modelo/web build` → revisar `prettier`.

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Tipografía Outfit (font file + @font-face + tokens + config) | [✓] Completado | sin commit (skip) | 🟡 | Afecta headings globales |
| 2 | Componente HomeHero (estructura + 3 modos de media) | [✓] Completado | `364214d` | 🟠 | Lógica condicional de media |
| 3 | HomeHero.css (grid 55/45, badge dot, staggered load) | [✓] Completado | `364214d` | 🟡 | Motion CSS + reduced-motion |
| 4 | VideoModal glass play button + ping + hover zoom | [✓] Completado | `53eb2b5` | 🟡 | Reestilo del único uso |
| 5 | Navbar (entrada + intranet secondary) | [✓] Completado | `c98baa2` | 🟢 | Cambio menor |
| 6 | index.astro (integrar HomeHero, id=niveles, smooth scroll, preload) | [✓] Completado | `53eb2b5` | 🟡 | Limpieza de estilos inline |
| 7 | Verificación: check + build + prettier | [✓] Completado | `53eb2b5` | 🟢 | 0 errores, 0 warnings, build OK |

---

## Registro de commits

| Commit | Descripción |
|--------|-------------|
| `364214d` | feat(web): crear componente modular HomeHero (pasos 2+3) |
| `c98baa2` | feat(web): animación de entrada del navbar + Intranet secondary (paso 5) |
| `53eb2b5` | feat(web): hero con video showcase + fuente Outfit (pasos 1+4+6+7) |

---

## Incidentes y desvíos

- **2026-09-02 · Check inicial fallido (6 errores):** rutas relativas incorrectas en `HomeHero.astro` (faltaba un nivel `../../../../`) y `heroDescription` podía ser `undefined`. Corregido: rutas a 4 niveles + fallback `shortDescription || ""`.
- **2026-09-02 · Check 2º (2 errores):** props opcionales `heroPhoto`/`videoUrl` pasadas a componentes que exigen `string`. Corregido con defaults en el destructuring.
- **2026-09-02 · Prettier (4 archivos):** formateados con `prettier --write`.
- **2026-09-02 · WARN lightningcss `:global`:** `HomeHero.css` es CSS global (no scoped), `:global(img)` no aplica. Cambiado a `.homeHero__frame img`. El WARN restante de `newsList` es preexistente.
- **2026-09-02 · Descarga de Outfit:** el CDN `cdn.jsdelivr.net/fontsource/fonts/outfit@latest/...` devolvió 404; se usó la ruta del paquete npm `@fontsource-variable/outfit@latest/files/...` (32 KB, woff2 válido).