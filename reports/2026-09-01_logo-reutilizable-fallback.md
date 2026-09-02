# Componente de logo reutilizable con fallback generado

> **Creado:** 2026-09-01 22:07
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro 7.2.9 (SSG) + Tailwind v4 + TypeScript
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** [✓] COMPLETADO

---

## Plan original

Implementa un componente de logo reutilizable con fallback generado en la web pública Astro del monorepo (apps/web). El objetivo es que la plantilla sirva a varios colegios (multi-tenant por instancia): cada colegio configura src/site.config.ts (nombre, colores, contactos, rutas de assets) y public/branding/. El problema actual es que el logo.svg de ejemplo usa <text> con la fuente Inter, que no se renderiza dentro de un <img> (contexto SVG aislado sin acceso al webfont de la página), por lo que el wordmark no se ve y en algunos navegadores el SVG completo falla.

REQUISITOS FUNCIONALES:
1. Crear un componente reutilizable apps/web/src/shared/ui/Logo/Logo.astro (+ su Logo.css) con esta lógica:
   - Props: variant?: "light" | "dark" (navbar claro vs footer oscuro), size?: "sm" | "md" | "lg", class?.
   - Si siteConfig.branding.assets.logo apunta a un archivo real (ej. /branding/logo.png o .svg), renderiza <img src={...} alt={siteConfig.identity.name}> (soporta cualquier extensión).
   - Si NO hay logo real (fallback): renderiza un ícono (círculo + triángulo) como SVG inline geométrico SIN fuentes (siempre visible), coloreado con tokens CSS var(--color-primary) / var(--color-text-inverse) según variant, más el nombre siteConfig.identity.name como texto HTML real (que sí carga la fuente Inter de la página). Usa SOLO tokens CSS existentes (--color-*, --font-*, --radius-*), nunca colores crudos ni inline styles.
2. Reemplazar el uso de <img> del logo en los 3 layouts:
   - apps/web/src/shared/layouts/Navbar.astro (líneas ~47-54): usar <Logo variant="light">, manteniendo transition:name="navbar-logo" en el <a> padre.
   - apps/web/src/shared/layouts/Footer.astro (líneas ~56-64): usar <Logo variant="dark"> (usa logoInverse si existe, sino fallback claro).
   - apps/web/src/shared/layouts/MobileDrawer.astro (líneas ~31-38): usar <Logo variant="light">.
   - Ajustar Navbar.css, Footer.css y MobileDrawer.css al nuevo marcado, conservando los tamaños máximos actuales (navbar 7.5rem/9rem, footer 10rem).
3. En apps/web/src/site.config.ts: hacer opcionales (en el schema zod brandingSchema.assets) los campos logo y logoInverse, para que un colegio pueda omitirlos y usar el fallback generado. Mantener el resto igual.
4. En apps/web/src/shared/lib/validateConfig.ts: permitir que logo y logoInverse sean opcionales (no romper el build si se omiten); mantener la validación de existencia de archivo cuando el path SÍ está definido.
5. Crear apps/web/docs/onboarding-colegio.md con la guía breve de cómo desplegar la plantilla para un colegio nuevo: (1) instanciar con PUBLIC_TENANT_ID nuevo en .env, (2) editar site.config.ts (nombre, colores, contactos, rutas de assets), (3) colocar el logo real del colegio en public/branding/logo.* (PNG o SVG) y apuntar branding.assets.logo, o dejar vacío para usar el logo generado, (4) configurar dominio y env vars en Vercel, (5) pnpm --filter @web-modelo/web check + build + deploy.
6. Convertir el <text> del wordmark a <path> vectoriales en apps/web/public/branding/logo.svg y apps/web/public/branding/logo-inverse.svg, manteniendo el mismo aspecto (círculo azul + triángulo + "Colegio Piloto" en Inter SemiBold), para que esos archivos funcionen como logo real si se usan fuera del componente (p. ej. como <img> directo, og-image o favicon). El resultado debe verse idéntico al diseño actual pero sin depender de fuentes.

RESTRICCIONES:
- No modifiques la lógica de negocio ni el contenido editorial.
- Respeta las convenciones del proyecto: clases BEM en CSS externo, componentes PascalCase, tokens CSS, mobile-first, sin colores crudos ni inline styles.
- No toques apps/admin ni apps/aula.

VERIFICACIÓN OBLIGATORIA:
- pnpm --filter @web-modelo/web check  (debe pasar sin errores)
- pnpm --filter @web-modelo/web build  (debe pasar)
- Inspeccionar apps/web/dist/ y confirmar que el navbar y el footer renderizan el logo correctamente, tanto con logo real como con el fallback generado (probar ambos casos cambiando temporalmente site.config.ts si hace falta, y revertir).
- Confirmar que los logo.svg y logo-inverse.svg convertidos a paths se ven correctamente al abrirlos directamente (sin depender de fuentes).
- Reportar los archivos modificados/creados y el resultado de cada verificación.

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Crear `shared/ui/Logo/Logo.astro` + `Logo.css` | [✓] Completado | sin commit (skip) | 🟡 | — |
| 2 | Reemplazar `<img>` logo en Navbar, Footer y MobileDrawer + ajustar sus CSS | [✓] Completado | sin commit (skip) | 🟡 | Logo.astro ajustado para usar logoInverse ?? logo en variant dark |
| 3 | `site.config.ts`: logo y logoInverse opcionales en zod | [✓] Completado | sin commit (skip) | 🔵 | — |
| 4 | `validateConfig.ts`: logo/logoInverse opcionales con validación condicional | [✓] Completado | sin commit (skip) | 🟢 | El filtro de tipo ya excluía undefined; solo se añadió comentario documental |
| 5 | Crear `docs/onboarding-colegio.md` | [✓] Completado | `5536276` | 🟢 | — |
| 6 | Convertir `<text>` a `<path>` en logo.svg y logo-inverse.svg | [✓] Completado | `c2ed14e` | 🟡 | Wordmark convertido con fontkit (Inter SemiBold 18px); renderizado verificado por análisis de píxeles |
| 7 | Verificación final: check + build + inspección dist/ (logo real y fallback) | [✓] Completado | `7cfeeb5` | 🟡 | check ✅ (0 errores) · build ✅ · Caso A (img logo.svg/logo-inverse.svg) ✅ · Caso B (fallback SVG inline + nombre) ✅ · Se corrigieron 3 usos de branding.assets.logo en JSON-LD (index, noticias/[slug], SEOHead) que asumían string |

---

## Registro de commits

| Commit | Paso | Descripción |
|--------|------|-------------|
| `5536276` | 5 | docs(web): add school onboarding guide |
| `c2ed14e` | 6 | fix(web): convert logo wordmark from `<text>` to vector `<path>` |
| `7cfeeb5` | 7 | fix(web): handle optional logo in JSON-LD and add Logo component |

> Pasos 1-4 sin commit individual (usuario eligió "skip"): el componente Logo
> (Paso 1) quedó incluido en `7cfeeb5`. Los cambios de los Pasos 2-4
> (layouts, site.config.ts, validateConfig.ts) quedaron sin commitear.

---

## Incidentes y desvíos

- **2026-09-01 22:31** — `astro check` falló tras hacer `logo` opcional (Paso 3): 3 errores ts(2345) en `index.astro`, `noticias/[slug].astro` y `SEOHead.astro` porque usaban `siteConfig.branding.assets.logo` como `string`. Se corrigió omitiendo el campo `logo` del JSON-LD cuando no está definido (schema.org lo permite). Verificado con check ✅.
- **2026-09-01 22:37** — `prettier --check` falló en 3 archivos nuevos (`docs/onboarding-colegio.md`, `Logo.astro`, `Logo.css`). Se ejecutó `prettier --write`. Verificado con check ✅.
- **2026-09-01 22:42** — Verificación del fallback: se omitió temporalmente `logo`/`logoInverse` en `site.config.ts`, se rebuildó (Caso B confirmado) y se revirtió el archivo a su estado original.
