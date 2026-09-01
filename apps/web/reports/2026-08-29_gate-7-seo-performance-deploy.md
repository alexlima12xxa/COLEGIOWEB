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

| #   | Paso                                                                 | Estado        | Commit    | Dificultad | Notas                                                    |
| --- | -------------------------------------------------------------------- | ------------- | --------- | ---------- | -------------------------------------------------------- |
| 1   | Fonts Inter self-hosted + @font-face font-display swap + preload     | ✅ Completado | `64035ea` | 🟡         | Inter variable latín (71KB + 78KB)                       |
| 2   | Sitemap dinámico (config + noticias)                                 | ✅ Completado | `49c1662` | 🔵         | 27 URLs + fix canonical                                  |
| 3   | robots.txt                                                           | ✅ Completado | `ab8ce59` | 🟢         | Allow / + Disallow /admin/                               |
| 4   | JSON-LD School (reemplaza EducationalOrganization)                   | ✅ Completado | `357c8a4` | 🔵         | +foundingDate, contactPoint                              |
| 5   | JSON-LD VideoObject (tour Home)                                      | ✅ Completado | `39995b1` | 🔵         | name/thumb/uploadDate/contentUrl                         |
| 6   | JSON-LD BreadcrumbList (noticias detalle + niveles)                  | ✅ Completado | `1e52801` | 🟡         | 2 plantillas + pageUrl alineado                          |
| 7   | Auditoría Lighthouse base (Home, /noticias, /noticias/[slug])        | ✅ Completado | `61dbc79` | 🔵         | Home 87/100, Noticias 70 (LCP 9s), Detalle 85 (CLS 0.27) |
| 8   | Correcciones performance Home → 100                                  | ✅ Completado | `1895484` | 🟡         | 99/100/100/100 (CLS 0.01, LCP 1.7s)                      |
| 9   | Correcciones Noticias (índice + detalle) → 100                       | ⏳ Pendiente  | —         | 🟡         |                                                          |
| 10  | Pruebas responsive < 375px + fixes overflow                          | ⏳ Pendiente  | —         | 🟡         |                                                          |
| 11  | Re-auditoría final Lighthouse 100/100 (evidencia)                    | ⏳ Pendiente  | —         | 🔵         |                                                          |
| 12  | Deploy Vercel (link + deploy + URL)                                  | ⏳ Pendiente  | —         | 🟡         | CLI no instalada                                         |
| 13  | Deploy hook Vercel (para webhook Supabase)                           | ⏳ Pendiente  | —         | 🟡         | requiere auth Vercel                                     |
| 14  | Kit de cambio de colegio: checklist 15 min + validar build con marca | ⏳ Pendiente  | —         | 🟡         |                                                          |

---

## Registro de commits

| Commit    | Paso | Mensaje                                                                 |
| --------- | ---- | ----------------------------------------------------------------------- |
| `64035ea` | 1    | feat(fonts): self-host Inter variable con font-display swap             |
| `49c1662` | 2    | feat(seo): sitemap dinámico + canonical consistente con trailing slash  |
| `ab8ce59` | 3    | feat(seo): robots.txt con referencia a sitemap                          |
| `357c8a4` | 4    | feat(seo): JSON-LD School en todas las páginas                          |
| `39995b1` | 5    | feat(seo): JSON-LD VideoObject para el tour virtual en la Home          |
| `1e52801` | 6    | feat(seo): JSON-LD BreadcrumbList en noticias y niveles                 |
| `61dbc79` | 7    | chore(perf): auditoría Lighthouse base GATE 7 (home, noticias, detalle) |
| `1895484` | 8    | perf(home): 87 → 99 Lighthouse móvil (CLS 0.18→0.01, LCP 2.9s→1.7s)     |

---

## Incidentes y desvíos

- **2026-08-29 (Paso 2)**: Detectada inconsistencia preexistente de canonical — páginas estáticas declaraban URLs con trailing slash (`/nosotros/`) pero noticias (index, detalle, paginación) y circulares lo declaraban sin slash (`/noticias/x`). Riesgo de contenido duplicado ante Google. Corregido de forma centralizada en `SEOHead.astro` (normalización a trailing slash, formato `directory` de Astro). Sitemap generado con la misma convención: `<loc>` coincide 1:1 con el canonical de cada página.
- **2026-08-29 (Paso 7)**: Hallazgos de auditoría base (throttling móvil estricto, distinto de mediciones previas):
  - Noticias LCP 9.0s: imágenes de CMS en `public/media/uploads/` se sirven sin optimizar (`ContentImage` solo procesa remotas). `yachay.png` = 1.8MB.
  - CLS Home 0.18 y Detalle 0.27: posters/imágenes sin dimensiones + **bug sistémico**: estilos scoped de Astro no aplican al HTML inyectado con `set:html` (contenido markdown) — el CSS de `.newsDetail__body` y `.homeHero__photo img` nunca se aplicó.
  - A11y Detalle 96: `link-in-text-block` (links del artículo sin subrayado, consecuencia del bug scoped).
  - A11y Noticias 98: `heading-order` (h3 directo bajo h1).
- **2026-08-29 (Paso 8)**: Home llevada de 87 → 99/100/100/100 (Lighthouse móvil, throttling devtools 4G). CLS 0.18 → 0.014, LCP 2.9s → 1.7s, FCP 2.3s → 1.3s. Causas: (1) CSS inline elimina 6 requests render-blocking; (2) poster del tour sin dimensión reservada → aspect-ratio en contenedor + eager; (3) swap de fuente → @font-face `Inter-fallback` con métricas calibradas; (4) imágenes optimizadas a AVIF (hero 88KB→26KB). El 1 punto restante de performance es el LCP 1.7s vs umbral 1.5s bajo throttling agresivo + fuente self-hosted obligatoria. **Hallazgo adicional**: 2 errores TS preexistentes en `BaseLayout.astro` (widget Netlify Identity con dominio mal escrito `coegioweb.netlify.app`) — leftover de migración Netlify→Vercel, a resolver en Paso 12.
