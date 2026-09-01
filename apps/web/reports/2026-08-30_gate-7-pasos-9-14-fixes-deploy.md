# GATE 7 — Pasos 9–14 (Fix Noticias 100 · Responsive <375 · Re-auditoría · Deploy Vercel · Webhook · Kit cambio de colegio)

> **Creado:** 2026-08-30
> **Proyecto:** WEB-MODELO-1 (Colegio Piloto)
> **Stack:** Astro 7.2.9 SSG + Tailwind v4 + Supabase · Deploy Vercel
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** 🟡 EN PROGRESO

---

## Plan original

Continuación del plan GATE 7. Pasos 1–8 ya completados (commits `64035ea` → `1895484`) y plan lateral `c77b7bc` (eliminación Decap CMS + endurecer imágenes) completado.

**PASO 9 — Fix Noticias → 100:**

- Fix bug scoped CSS en `src/pages/noticias/[slug].astro` (detalle): pasar a `:global()` los selectores de `.newsDetail__body` (h2, h3, p, a, ul, ol, blockquote, table, th, td) y `.newsDetail__image`. Resuelve CLS 0.27 y el fallo a11y `link-in-text-block`.
- Fix `heading-order` en NewsCard/NewsList (h3 → h2 o añadir h2).
- Re-auditar `/noticias` y `/noticias/[slug]` con Lighthouse y confirmar LCP en verde y a11y → 100.

**PASO 10 — Responsive < 375px:** probar Home, Noticias, detalle y resto de páginas a anchos < 375px (320px, 360px). Buscar overflow horizontal y elementos rotos. Corregir solo lo que se rompa.

**PASO 11 — Re-auditoría final:** Lighthouse móvil en Home, /noticias y detalle. Registrar los 4 scores como evidencia final.

**PASO 12 — Deploy Vercel:**

- Verificar estado del build/URL (ya conectado por git).
- Decidir: instalar `vercel` CLI para verificar estado, O pedir al usuario el estado desde el dashboard.
- Resolver leftover Netlify Identity en `src/shared/layouts/BaseLayout.astro` (2 errores TS + dominio `coegioweb.netlify.app`): quitar script de Netlify Identity.
- Verificar `pnpm build` limpio antes del deploy.

**PASO 13 — Deploy hook Vercel:**

- Crear deploy hook en dashboard Vercel (Settings → Git → Deploy Hooks → "supabase-rebuild" → rama main). Acción manual del usuario.
- La edge function `supabase/functions/rebuild-webhook/index.ts` ya está lista (espera `VERCEL_DEPLOY_HOOK_URL`).
- Documentar: `supabase secrets set VERCEL_DEPLOY_HOOK_URL=...` y dejar la URL documentada en `supabase/functions/README.md`.

**PASO 14 — Kit de cambio de colegio:**

- Crear checklist documentado "cambio de colegio en < 15 min" (archivos a tocar: `src/site.config.ts`, `public/branding/`, `.env`). Ubicación: `docs/` o `.agents/`.
- VALIDAR: cambio completo de marca de prueba, `pnpm build` exitoso, y revertir (o dejar documentado).

---

## Estado de ejecución

| #   | Paso                                                       | Estado        | Commit    | Dificultad | Notas                                                                          |
| --- | ---------------------------------------------------------- | ------------- | --------- | ---------- | ------------------------------------------------------------------------------ |
| 9   | Fix Noticias → 100 (scoped CSS + heading-order + re-audit) | ✅ Completado | `8ff1247` | 🟡         | /noticias 99/100/100/100 · detalle 99/100/100/100 · LCP 1.9s/1.8s · CLS 0      |
| 10  | Responsive < 375px                                         | ✅ Completado | —         | 🟢         | 0 overflow en 10 páginas a 320px/360px (CDP headless)                          |
| 11  | Re-auditoría final Lighthouse                              | ✅ Completado | `88aed4e` | 🟢         | Home/Noticias/Detalle 99/100/100/100                                           |
| 12  | Deploy Vercel                                              | ✅ Completado | `37c2459` | 🟠         | push a main (14 commits) · build Vercel disparado · verificar URL en dashboard |
| 13  | Deploy hook Vercel                                         | ⏳ Pendiente  | —         | 🟡         | acción manual usuario                                                          |
| 14  | Kit de cambio de colegio                                   | ⏳ Pendiente  | —         | 🟡         |                                                                                |

---

## Registro de commits

| Commit    | Paso | Mensaje                                                              |
| --------- | ---- | -------------------------------------------------------------------- |
| `8ff1247` | 9    | fix(noticias): scoped CSS :global + heading-order + LCP imagen eager |

---

## Incidentes y desvíos

- Working tree con cambio sin commitear: `reports/2026-08-30_eliminar-decap-cms-endurecer-imagenes.md` (leftover de sesión previa, solo marca estado a ✅ COMPLETADO). Se deja fuera de los commits de esta sesión.
- **Desvío menor (Paso 9):** el LCP de /noticias quedaba en 3.3s (naranja) tras el fix del bug scoped CSS. Causa raíz adicional: la primera imagen de la lista (`NewsCard`) estaba `loading=lazy` + `fetchpriority=auto`. Fix aplicado: `eager` + `fetchpriority=high` en la primera tarjeta (prop `eager` en NewsCard, pasada por NewsList con `index === 0`). Resultado: LCP 3.3s → 1.9s.
- **Observación pre-existente (no tocada):** `src/features/noticias/components/NewsList.css` línea 28 usa `:global(.card)` dentro de un archivo CSS externo (no es un `<style>` scoped), lo que genera un warning de lightningcss (`'global' is not a valid pseudo-class`) y el selector no resuelve. No afecta el layout visible (las tarjetas llenan la celda de grid por flexbox). Se revisa en Paso 10 (responsive) si amerita corrección.

### Verificación Paso 10 (responsive < 375px)

- Método: Chrome headless + CDP (`Emulation.setDeviceMetricsOverride` mobile). Se midió `document.documentElement.scrollWidth` vs `clientWidth` y se detectaron elementos con `getBoundingClientRect()` fuera del viewport (ignorando los contenidos dentro de contenedores con `overflow-x: auto/scroll/hidden`).
- Páginas probadas a **320px y 360px**: `/`, `/noticias/`, `/noticias/[detalle]/`, `/nosotros/`, `/niveles/`, `/niveles/preescolar/`, `/admisiones/`, `/circulares/`, `/contacto/`, `/aviso-de-privacidad/`.
- Resultado: **0 overflow horizontal** y **0 elementos desbordados** en todos los casos. No se requirieron cambios de código.
- La tabla de circulares (`min-width:46rem` en `CircularesList.css`) se desplaza dentro de su contenedor `overflow-x:auto`, sin causar scroll de página.

### Evidencia final Lighthouse (Paso 11) — móvil, throttling devtools 4G estricto

| Página                        | Performance | Accessibility | Best Practices | SEO | LCP  | CLS   | TBT   |
| ----------------------------- | ----------- | ------------- | -------------- | --- | ---- | ----- | ----- |
| Home (`/`)                    | **99**      | 100           | 100            | 100 | 1.7s | 0.014 | 100ms |
| Noticias (`/noticias/`)       | **99**      | 100           | 100            | 100 | 1.8s | 0     | 80ms  |
| Detalle (`/noticias/[slug]/`) | **99**      | 100           | 100            | 100 | 1.9s | 0     | 70ms  |

- JSON de evidencia: `reports/lh-final-home.json`, `reports/lh-final-noticias.json`, `reports/lh-final-detalle.json`.
- **Justificación de Perf=99 (no 100):** el único factor que resta es el Total Blocking Time (~70–100ms) del JS interactivo imprescindible: Astro `ClientRouter` (View Transitions) + drawer de navegación móvil (menú accesible con focus trap). Eliminarlo requeriría quitar funcionalidad de navegación. A11y / Best Practices / SEO están en 100 y el LCP/CLS en verde. Cumple el criterio de aceptación "100/100 o lo más cercano con justificación".

### Deploy Vercel (Paso 12)

- **Fix aplicado:** eliminado el `<script>` de Netlify Identity en `src/shared/layouts/BaseLayout.astro` (leftover de migración Netlify→Vercel, dominio mal escrito `coegioweb.netlify.app`). Resuelve los 2 errores TS (`netlifyIdentity` no existe en `Window`). `/admin` (Decap CMS) ya no existe desde `c77b7bc`, el script no aplicaba.
- **Verificación:** `pnpm build` limpio (25 páginas) + `pnpm astro check` → **0 errors** (antes 2).
- **Deploy:** `git push origin main` → `e2de1a8..37c2459` (14 commits del GATE 7). El push dispara el build+deploy de Vercel (repo conectado por git). Sin CLI `vercel` local (decisión: no instalar, el flujo git es suficiente).
- **Pendiente de verificación por el usuario:** estado del build y URL en el dashboard de Vercel (o commit status checks en GitHub).
