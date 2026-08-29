# GATE 7 — SEO, Lighthouse 100/100, Deploy Vercel y Kit de cambio de colegio

> **Creado:** 2026-08-29
> **Proyecto:** WEB-MODELO-1 (Colegio Piloto)
> **Stack:** Astro 7.2.9 (SSG) + Tailwind v4 + Supabase · Vercel
> **Riesgo:** ALTO
> **Modo de ejecución:** MANUAL
> **Estado:** 🟡 EN PROGRESO

---

## Plan original (tareas del usuario)

GATE 7 — criterio de aceptación:
- 100/100 Lighthouse móvil
- cambio completo de colegio en < 15 min con build exitoso
- deploy en Vercel con webhook funcional

1. **SEO**: sitemap dinámico (desde config + noticias), robots.txt, JSON-LD por página
   (School, FAQPage, VideoObject, BreadcrumbList). Fonts self-hosted con font-display swap.
2. **Auditoría Lighthouse**: objetivo 100/100 móvil en Home, Noticias y detalle.
3. **Pruebas responsive** en dispositivos reales < 375px.
4. **Deploy a Vercel** + configurar deploy hook (para el webhook rebuild de Supabase).
5. **Kit de cambio de colegio**: checklist de 15 min + validar que un cambio de marca
   completo pasa el build.

---

## Estado actual detectado (2026-08-29)

- Sitio Astro SSG funcional: Home, Noticias (índice + detalle + paginación), Niveles, Admisiones, Contacto, Nosotros, Circulares, Aviso de privacidad.
- White-label 100% vía `src/site.config.ts` (validado con zod en build).
- `SEOHead.astro`: EducationalOrganization JSON-LD + OG/Twitter + canonical. Artículo JSON-LD en detalle. FAQPage en admisiones.
- **Falta**: sitemap.xml, robots.txt, JSON-LD School/VideoObject/BreadcrumbList, fonts self-hosted (Inter se referencia pero NO hay @font-face ni archivos).
- Lighthouse previo (móvil): home 97 perf / 100 a11y; contacto 100; admisiones 96 a11y; nosotros 98 a11y; nivel 97 a11y. **Noticias no auditadas.**
- Supabase: edge function `rebuild-webhook` lista (espera `VERCEL_DEPLOY_HOOK_URL`).
- Git remote: `github.com/alexlima12xxa/COLEGIOWEB.git` (ya desplegado vía git). `.vercel/` sin link local. CLI `vercel` no instalada.
- Cambios sin commitear: `package.json`/`pnpm-lock.yaml` (agregan `decap-cms`).
- Chrome disponible: `C:\Program Files\Google\Chrome\Application\chrome.exe`. Lighthouse vía `npx`.

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Fonts Inter self-hosted + @font-face font-display swap + preload | ⏳ Pendiente | — | 🟡 | public/fonts/ + _fonts.css |
| 2 | Sitemap dinámico (config + noticias) | ⏳ Pendiente | — | 🔵 | src/pages/sitemap.xml.ts |
| 3 | robots.txt | ⏳ Pendiente | — | 🟢 | src/pages/robots.txt.ts |
| 4 | JSON-LD School (reemplaza EducationalOrganization) | ⏳ Pendiente | — | 🔵 | SEOHead.astro |
| 5 | JSON-LD VideoObject (tour Home) | ⏳ Pendiente | — | 🔵 | index.astro |
| 6 | JSON-LD BreadcrumbList (noticias detalle + niveles) | ⏳ Pendiente | — | 🟡 | 2 plantillas |
| 7 | Auditoría Lighthouse base (Home, /noticias, /noticias/[slug]) | ⏳ Pendiente | — | 🔵 | capturar baseline |
| 8 | Correcciones performance Home → 100 | ⏳ Pendiente | — | 🟡 | LCP/CLS |
| 9 | Correcciones Noticias (índice + detalle) → 100 | ⏳ Pendiente | — | 🟡 | |
| 10 | Pruebas responsive < 375px + fixes overflow | ⏳ Pendiente | — | 🟡 | |
| 11 | Re-auditoría final Lighthouse 100/100 (evidencia) | ⏳ Pendiente | — | 🔵 | |
| 12 | Deploy Vercel (link + deploy + URL) | ⏳ Pendiente | — | 🟡 | CLI no instalada |
| 13 | Deploy hook Vercel (para webhook Supabase) | ⏳ Pendiente | — | 🟡 | requiere auth Vercel |
| 14 | Kit de cambio de colegio: checklist 15 min + validar build con marca | ⏳ Pendiente | — | 🟡 | |

---

## Registro de commits

_(Se llenará conforme avance la ejecución)_

---

## Incidentes y desvíos

_(Vacío al inicio. Se registra cualquier problema encontrado durante la ejecución)_
