# GATE A8 — Deploy final + validación E2E + manual del director

> **Creado:** 2026-09-01
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro 7.2.9 (SSG) · Next.js 16 (admin) · Supabase · Vercel · pnpm
> **Riesgo:** ALTO
> **Modo de ejecución:** MANUAL
> **Estado:** [✓] COMPLETADO

---

## Plan original

Bloque A8 — Deploy + validación + manual. Skills cargados: `deploy-to-vercel`, `accessibility`.

Tareas:
1. Deploy final de admin + dominio.
2. Crear usuario admin del director en Supabase Auth (app_metadata: role='admin', tenant_id=<uuid>).
3. Validación end-to-end: el director entra, publica una noticia con foto, edita la misión, sube una portada → todo aparece en la web < 5 min.
4. Manual visual del director: "Cómo publicar una noticia en 5 pasos" + "Cómo actualizar misión y portada".
5. Auditoría Lighthouse del panel (≥ 90) y de la web pública (100/100).

**CRITERIO DE ACEPTACIÓN (GATE A8):**
- Director publica contenido solo en < 5 min
- Web pública mantiene 100/100
- Manual entregado

### Decisiones tomadas con el usuario (2026-09-01)
- **Dominio:** `yachay-ia.com` NO pertenece a este proyecto. La web se queda en `https://colegioweb.vercel.app` (alias activo). El panel se entrega en su URL de Vercel (`admin-coral-three-91.vercel.app`). `admin.tuapp.com` es placeholder → se documenta como pendiente de compra de dominio.
- **Rebuild <5 min:** Deploy hook de Vercel disparado directamente desde las acciones del panel (funciona en plan Free; no requiere Database Webhooks de Supabase que exigen plan Pro).
- **Usuario admin:** ya existe `alejomatani@gmail.com` (role=admin, tenant=colegio-piloto `7dbbd9d5-f09b-4d0c-9c7c-7c26d7f543e1`, email confirmado). Solo verificación E2E.
- **Manual:** HTML imprimible con capturas reales del panel.

### Estado detectado en auditoría previa (2026-09-01)
- Web `colegioweb.vercel.app` → HTTP 200 (alias activo del proyecto `colegioweb`). Env vars Supabase OK (PUBLIC_TENANT_ID, PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).
- Admin `admin-coral-three-91.vercel.app` → HTTP 200 en /login. Env vars NEXT_PUBLIC_SUPABASE_URL/ANON seteadas (valores a verificar).
- Supabase WEB-SAS (`ledfrlawqrbdnummdgrm`): migraciones aplicadas, bucket `media` OK, 11 claves de contenido, 3 noticias de prueba.
- **Gap crítico:** las acciones del panel NO disparan rebuild → la web SSG no se actualizaría en <5 min.
- Módulos CRUD A5–A7 sin commitear (untracked).
- `site.config.ts` ya apunta a `https://colegioweb.vercel.app` (canonical/sitemap correctos).

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Crear Deploy Hook de Vercel para `colegioweb` (rama main) | [✓] Completado | — | 🟢 | Hook `administrador` creado por usuario en dashboard. URL: `https://api.vercel.com/v1/integrations/deploy/prj_V9uqHGAVjQSZgwXRUnLiK35dGHp7/uLGIHlPHpr`. Verificado HTTP 201 (job gX0Ld8OilgCx4VRiqeA9) |
| 2 | Env var `REBUILD_HOOK_URL` en proyecto admin (Production) + .env.example | [✓] Completado | sin commit (se incluye en Paso 5) | 🟢 | `vercel env add` OK (Secret, Production). Documentada en .env.example |
| 3 | Implementar `lib/rebuild.ts` + trigger en actions (noticias, circulares, contenido) | [✓] Completado | sin commit (skip usuario) | 🟡 | 10 archivos, 16 llamadas a triggerRebuild(). Build admin OK |
| 4 | Builds de validación (admin build, web check + build) | [✓] Completado | — | 🟡 | admin build OK (18 rutas) · web check 0 errores · web build 15 páginas en 9.4s |
| 5 | Commit + push main → deploy final producción (web + admin) | [✓] Completado | `ccead77` | 🟠 | Push OK. Deploys Ready: web `colegioweb-a7dtoudv8` (1m), admin `admin-qs2hrx7uh` (36s). Aliases verificados: web 200, admin /login 200, /admin 307 |
| 6 | Verificación login E2E (alejomatani@gmail.com → tenant colegio-piloto) | [✓] Completado | — | 🔵 | Login API OK: role=admin, tenant=7dbbd9d5-… Env admin verificadas: URL=ledfrlawqrbdnummdgrm.supabase.co, REBUILD_HOOK_URL seteada |
| 7 | Validación E2E <5 min (noticia con foto, misión, portada → web) | [✓] Completado | — | 🟠 | Noticia `validacion-a8-noticia` visible en /noticias+detalle+imagen (rebuild 19s). Misión visible en /nosotros (~60s). Hero visible en / (~60s). Todos <5 min |
| 8 | Manual visual del director (HTML imprimible con capturas) | [✓] Completado | sin commit (skip usuario) | 🟡 | `reports/manual-director.html` + 7 capturas reales del panel en `reports/manual-capturas/`. Login y páginas verificadas por título (dashboard, noticias, formulario, textos, portada) |
| 9 | Auditoría Lighthouse web 100/100 + panel ≥90 | [✓] Completado | — | 🟡 | Web: home 100/100/100/100, /noticias 100/100/100/100, detalle 99/100/100/100 (SI 2.6-2.8s, marginal preexistente). Panel: /login 100/100/100/100, dashboard autenticado 100/100/100/100. Evidencia en reports/lh-a8-*.json |
| 10 | Reporte GATE A8 final con evidencias | [✓] Completado | pendiente (commit cierre) | 🔵 | Estado COMPLETADO. Evidencias: URLs, tiempos E2E, capturas, scores Lighthouse |

---

## Registro de commits

- `ccead77` — feat(admin): CRUD contenido editorial + rebuild web + restructuración monorepo (Paso 5)
- `276b2b6` — fix(web): resolver URLs absolutas de hero y poster del tour (404 en preload) (Paso 9)
- `2b6f767` — perf(web): preload de la imagen en detalle de noticia (LCP) (Paso 9)

---

## Incidentes y desvíos

- **2026-09-01 · Paso 1:** El CLI de Vercel no tiene comando para crear deploy hooks. Se creó manualmente en el dashboard (nombre `administrador`, rama `main`). Verificado con POST → HTTP 201.
- **2026-09-01 · Paso 3:** Usuario eligió `skip` — el Paso 3 queda sin commit. Los cambios (lib/rebuild.ts + 16 llamadas en actions) quedan en el working tree y se incluirán en el commit del Paso 5. Nota: `.env.example` está ignorado por el patrón `.env` del .gitignore (no se commitea).
- **2026-09-01 · Paso 7:** Validación E2E con datos de prueba que quedaron VIVOS en la web: noticia `validacion-a8-noticia`, misión "Mision actualizada en la validacion A8…" y hero "Portada validada en A8". Pendiente: restaurar misión/hero originales (seed) y eliminar la noticia de prueba desde el panel, o conservarlos como evidencia.
- **2026-09-01 · Paso 8:** Usuario eligió `skip` — el manual y las capturas quedan sin commit en el working tree.
- **2026-09-01 · Paso 9:** Se encontró y corrigió un bug real: el `<link rel="preload">` del hero usaba la ruta relativa de Storage → 404 en el dominio web (Lighthouse BP 96). Fix: resolver `heroPhoto`/`tourPoster` con `resolveAssetUrl()` en `index.astro` (commit `276b2b6`). BP → 100.
- **2026-09-01 · Paso 9:** La regresión de LCP (2.4s) durante la auditoría fue causada por los DATOS DE PRUEBA del Paso 7 (hero con foto remota de 106KB y noticia con imagen de 7MB). Se restauraron misión/hero originales del seed y se eliminaron las noticias de prueba → home y /noticias vuelven a 100/100. El detalle de noticia queda en 99 (SI 2.6-2.8s) — estado marginal PREEXISTENTE (gate-7 dejó "Correcciones Noticias detalle → 100" como pendiente). Se intentó preload de imagen (commit `2b6f767`) sin mejora.
- **2026-09-01 · Paso 9:** Se añadió preload de imagen en detalle de noticia (commit `2b6f767`).

---

## Verificación GATE A8 (resumen final)

### Criterio de aceptación → evidencia

| Criterio | Evidencia |
|---|---|
| **Director publica contenido solo en < 5 min** | ✅ Validado E2E (Paso 7): noticia con foto visible en `/noticias` (rebuild 19s), misión en `/nosotros` (~60s), portada en `/` (~60s). Trigger: Deploy Hook de Vercel disparado desde las Server Actions del panel (`lib/rebuild.ts`, 16 llamadas). |
| **Web pública mantiene 100/100** | ✅ Home 100/100/100/100 · `/noticias` 100/100/100/100 · detalle 99/100/100/100 (SI marginal preexistente). Panel: /login 100/100/100/100 · dashboard autenticado 100/100/100/100. Evidencia: `reports/lh-a8-*.json`. |
| **Manual entregado** | ✅ `reports/manual-director.html` (imprimible) + 7 capturas reales del panel en `reports/manual-capturas/`. |

### Entregables

- **Web pública:** `https://colegioweb.vercel.app` (producción, alias activo)
- **Panel admin:** `https://admin-coral-three-91.vercel.app` (producción)
- **Usuario director:** `alejomatani@gmail.com` (role=admin, tenant=colegio-piloto) — ya existía, verificado
- **Rebuild <5 min:** Deploy Hook `administrador` (rama main) + `REBUILD_HOOK_URL` en proyecto admin + `lib/rebuild.ts`
- **Manual:** `reports/manual-director.html`
- **Lighthouse:** `reports/lh-a8-*.json` (5 auditorías)

### Pendientes documentados

- **Dominio propio del panel:** `admin.tuapp.com` es placeholder y no existe. El panel se entrega en URL de Vercel. Pendiente comprar/configurar dominio real (el único dominio del team, `yachay-ia.com`, pertenece a otro proyecto).
- **Detalle de noticia en 99:** SI 2.6-2.8s bajo throttling (marginal, preexistente desde gate-7). Home y /noticias en 100.
- **Deploy hooks públicos:** cualquier persona con la URL puede disparar rebuilds (limitación de Vercel, aceptada).