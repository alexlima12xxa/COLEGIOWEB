# GATE A8 — Deploy final + validación E2E + manual del director

> **Creado:** 2026-09-01
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro 7.2.9 (SSG) · Next.js 16 (admin) · Supabase · Vercel · pnpm
> **Riesgo:** ALTO
> **Modo de ejecución:** MANUAL
> **Estado:** 🟡 EN PROGRESO

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
| 5 | Commit + push main → deploy final producción (web + admin) | ⏳ Pendiente | — | 🟠 | — |
| 6 | Verificación login E2E (alejomatani@gmail.com → tenant colegio-piloto) | ⏳ Pendiente | — | 🔵 | — |
| 7 | Validación E2E <5 min (noticia con foto, misión, portada → web) | ⏳ Pendiente | — | 🟠 | Cronómetro |
| 8 | Manual visual del director (HTML imprimible con capturas) | ⏳ Pendiente | — | 🟡 | — |
| 9 | Auditoría Lighthouse web 100/100 + panel ≥90 | ⏳ Pendiente | — | 🟡 | — |
| 10 | Reporte GATE A8 final con evidencias | ⏳ Pendiente | — | 🔵 | — |

---

## Registro de commits

_(Se llenará conforme avance la ejecución)_

---

## Incidentes y desvíos

- **2026-09-01 · Paso 1:** El CLI de Vercel no tiene comando para crear deploy hooks. Se creó manualmente en el dashboard (nombre `administrador`, rama `main`). Verificado con POST → HTTP 201.
- **2026-09-01 · Paso 3:** Usuario eligió `skip` — el Paso 3 queda sin commit. Los cambios (lib/rebuild.ts + 16 llamadas en actions) quedan en el working tree y se incluirán en el commit del Paso 5. Nota: `.env.example` está ignorado por el patrón `.env` del .gitignore (no se commitea).