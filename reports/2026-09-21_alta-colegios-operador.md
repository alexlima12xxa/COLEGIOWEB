# Alta de colegios desde `/operador` (rol superadmin)

> **Creado:** 2026-09-21
> **Proyecto:** WEB-MODELO-1 (monorepo pnpm)
> **Stack:** Astro SSG (`apps/web`) + Next.js 16.3.3 (`apps/admin`) + Supabase multi-tenant + Vercel
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** ✅ COMPLETADO

---

## Objetivo

Mover el alta de colegios del script local (token omnipotente en laptop) a un área
server-side del panel admin (`/operador`), autorizada por rol `superadmin`, con saga
idempotente y polling. **Solo colegios nuevos**; cambio **aditivo**; **NO se modifica `apps/web`**.

## Contrato de dos fases (obligatorio)

1. **FASE CÓDIGO** (agencia, PR): `apps/web/src/configs/<slug>.ts`, `apps/web/public/branding/<slug>/`, entrada en `clients.json`.
2. **FASE PROVISIÓN** (superadmin, UI `/operador`): BD + Vercel.

Orden crítico: código se mergea y despliega **antes** de provisionar.

## Arquitectura objetivo

```
apps/admin (Next.js)
├── /admin/*      PLANO TENANT     requireAdmin()      (sin cambios)
└── /operador/*   PLANO OPERADOR   requireSuperadmin() (nuevo)
                      ├─ lib/operator/supabase-admin.ts  (service_role, server-only)
                      ├─ lib/operator/vercel.ts          (VERCEL_TOKEN, server-only)
                      ├─ lib/operator/preflight.ts
                      └─ lib/operator/provision.ts       (saga idempotente)
```

El superadmin **no tiene `tenant_id`**; vive en plano separado. Escritura cross-tenant
**SIEMPRE** con `service_role` server-side.

## Decisiones cerradas

1. Ruta del operador: `/operador` (route group con layout propio).
2. Persistencia: **job asíncrono + polling** (`waitUntil` de `@vercel/functions`).
3. Credencial del director: `inviteUserByEmail` (sin contraseñas en claro).
4. Cada paso de la saga es **create-or-retrieve** (idempotente y reanudable).

## Correcciones de diseño (cierre de análisis 2026-09-21)

### F1 — El rol `superadmin` NO existe en la BD
Sin `is_superadmin()` ni policies `*_superadmin` en `colegios`. La identidad se valida en
`requireSuperadmin()` (capa de aplicación) y **todo** acceso a datos es `service_role`
server-side. `provisioning_jobs` y `operator_actions` con RLS fail-closed (solo service_role).

### F2 — Fuente de verdad del dominio
`clients.json` = fuente de SEO (inmutable, la valida `validateConfig.ts` en el build web).
`colegios.domain` = solo unicidad operativa/listado (índice único parcial, `lower(domain)`).

### F3 — Gate código→provisión
Preflight valida formato+unicidad (slug/dominio/email) y proyecto Vercel. La coherencia
dominio↔código la garantiza el **build de la web** (post-deploy). Gate humano: checkbox en
formulario "fase código mergeada".

### F4 — Saga con Route Handler + Polling (sin pg_cron)
`runProvisioning(jobId)` ejecuta pasos pendientes con **claim atómico** (basado en `updated_at`,
stale = 90s). Route handlers `POST crear`, `POST [id]/run`, `GET [id]/status`. La UI hace
polling cada 3s y reanuda idempotentemente. Errores categorizados `RECOVERABLE` / `FATAL`
(columna `error_code`).

### F5 — Bootstrap superadmin
`grant-superadmin.mjs` (uso único) con `SUPABASE_SERVICE_ROLE_KEY`; única vía de crear
superadmins. Documentar "cerrar sesión y volver a entrar" tras el bootstrap (JWT cacheado).

### F6 — Post-login por rol
`lib/roles.ts` (puro, edge-safe): `getPostLoginPath(user)` → superadmin `/operador`,
admin+tenant `/admin`, sin rol `/`. `proxy.ts` protege `/operador*`; `login()` usa
`resolvePostLoginPath(user, next)`.

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Migración SQL: `colegios.domain` + `provisioning_jobs`(+`error_code`) + `operator_actions` + grants | ✅ Completado | `35646c0` | 🟡 | — |
| 2 | Script `scripts/grant-superadmin.mjs` (bootstrap) | ✅ Completado | `e478732` | 🔵 | — |
| 3 | `lib/roles.ts` (módulo puro getPostLoginPath/isSuperadmin) | ✅ Completado | `fd3a2b2` | 🟢 | — |
| 4 | `proxy.ts` rama superadmin + protección `/operador` | ✅ Completado | `0291902` | 🟡 | — |
| 5 | `requireSuperadmin()` en `lib/auth.ts` | ✅ Completado | `3b6fe4a` | 🔵 | — |
| 6 | Post-login por rol (`login/actions.ts` + `login-form.tsx`) | ✅ Completado | `6ae106c` | 🔵 | — |
| 7 | `lib/operator/supabase-admin.ts` (service-role server-only) | ✅ Completado | `03f1c80` | 🔵 | — |
| 8 | `lib/operator/vercel.ts` (puerto tipado Vercel) | ✅ Completado | `cd22de6` | 🟠 | — |
| 9 | `lib/operator/preflight.ts` | ✅ Completado | `394de87` | 🟡 | — |
| 10 | `lib/operator/provision.ts` (saga + claim atómico) | ✅ Completado | `b299dbe` | 🟠 | — |
| 11 | Route handlers `crear`/`[id]/run`/`[id]/status` (+waitUntil+maxDuration) | ✅ Completado | `a5ec21d` | 🟡 | — |
| 12 | Plano `/operador` (layout, listado, formulario, detalle+polling) | ✅ Completado | `2dd695e` | 🟠 | — |
| 13 | `@vercel/functions` + env vars server-only (`.env.example`) | ✅ Completado | `6a68f0e` | 🟢 | — |
| 14 | Docs + deprecar `colegio-alta.mjs` + `PROJECT.md`/`AGENTS.md` | ✅ Completado | `221df51` | 🔵 | — |
| 15 | Verificación: `build` admin + `check` web | ✅ Completado | — | 🔵 | build admin OK · check web OK (0 errors) |

## Registro de commits

- `35646c0` — feat(db): dominio por colegio + jobs de provision + auditoria del operador
- `e478732` — feat(scripts): bootstrap grant-superadmin (unico canal de creacion de superadmins)
- `fd3a2b2` — feat(admin): modulo puro de roles (getPostLoginPath, isSuperadmin)
- `0291902` — feat(admin): rama superadmin en proxy.ts (proteccion /operador)
- `3b6fe4a` — feat(admin): requireSuperadmin en lib/auth.ts
- `6ae106c` — feat(admin): post-login por rol en login/actions.ts y login-form
- `03f1c80` — feat(admin): cliente service-role server-only (supabase-admin)
- `cd22de6` — feat(admin): puerto Vercel tipado server-only (vercel.ts)
- `394de87` — feat(admin): preflight con lectura de BD + gate de fase codigo
- `703c73b` — fix(db): persistir input de provision (domain, admin_email, nombre) en provisioning_jobs
- `b299dbe` — feat(admin): saga runProvisioning idempotente con claim atomico
- `6a68f0e` — chore(admin): agregar @vercel/functions y env vars server-only
- `a5ec21d` — feat(admin): route handlers crear/run/status con waitUntil + maxDuration
- `2dd695e` — feat(admin): plano /operador (layout, listado, formulario, detalle con polling)
- `221df51` — docs: alta de colegios desde el panel (operador) + deprecar script legacy
- `d6c9d6a` — feat(web): config + branding de colegio-yachay (fase codigo)
- `9580425` — fix(operator): usar campo target (singular) en la API de env de Vercel
- `90e84c3` — fix(operator): conectar repo Git al crear proyecto Vercel y endpoint correcto de deploy hooks
- `d936a2b` — docs(operator): documentar incidentes de API Vercel y requisito de Git
- `bfb47c5` — feat(operator): provisionar PREVIEW_SIGNING_KEY/ADMIN_ORIGIN y crear Secrets con tipo correcto

## Incidentes y desvíos

- **Reorden paso 13 → 11**: `@vercel/functions` (dependencia) se adelantó antes de los route handlers porque estos lo importan (`waitUntil`). Sin la dependencia linkeada, el build de los route handlers fallaría.
- **`apps/admin/.gitignore` ignoraba `.env*`**: se añadió excepción `!.env.example` y se eliminaron líneas duplicadas (`.vercel`, `.env*`) al final, para poder versionar el template sin secretos.
- **Archivo adicional**: `apps/admin/lib/operator/seed.ts` (plantilla de contenido) separado de `provision.ts` por modularidad.
- **Columna extra en la migración**: `provisioning_jobs.domain/admin_email/nombre` para persistir el input completo y reanudar la saga.

## Primera provisión real (2026-09-23) — incidentes y fixes

Alta de `colegio-yachay` (demo trabajado como real) desde `/operador`. La saga
superó BD/invitación/seed/proyecto, pero falló en dos puntos de la **API de Vercel**
(que cambió respecto a lo que asumía el script legacy). Ambos corregidos y
verificados con el token real:

1. **`targets` → `target`** (`9580425`): `POST /v10/projects/{id}/env` exige el
   campo `target` (singular). Con `targets` devolvía
   `400 missing required property 'target'`. Verificado: `target` → 201.
2. **Deploy hooks** (`90e84c3`):
   - Endpoint incorrecto (`POST /v10/projects/{id}/hooks` → 404). El correcto es
     `POST /v2/projects/{id}/deploy-hooks` con `{ name, ref }`; los hooks se leen
     de `link.deployHooks` del proyecto (como `vercel deploy-hooks ls`).
   - Los deploy hooks **requieren** que el proyecto esté conectado a Git. Ahora
     `createProject` usa `POST /v11/projects` con `gitRepository`
     (`VERCEL_GIT_REPO` = `owner/repo`; `VERCEL_GIT_PROVIDER` default `github`;
     `VERCEL_GIT_BRANCH` default `main`).
   - `VercelApiError` ahora incluye el cuerpo de la respuesta de Vercel.

**Recuperación de `colegio-yachay`:** el proyecto existía sin Git; se eliminó y la
saga lo recreó con Git. Los pasos `vercel_env` y `vercel_domain` quedaron `done`
del run previo y **se saltaron**, por lo que hubo que re-aplicar las 5 env vars y
el dominio a mano (API). Mejora pendiente: que `ensureProjectId` re-ejecute
env/dominio cuando recrea el proyecto.

**Resultado:** web en vivo y correcta (`title: Colegio Yachay - Excelencia y
Formación Integral`, `PUBLIC_SITE_SLUG=colegio-yachay` aplicado); proyecto con Git,
dominio y deploy hook; *Deployment Protection* desactivado para que sea pública.
Pendiente: DNS del subdominio (Cloudflare).

### Seguimiento (2026-09-23) — preview de banners y tipo de Secret

Detectado tras el alta: el editor de banners (`/admin/banners`) no previsualizaba.
Causa: el proyecto web **no** tenía `PREVIEW_SIGNING_KEY` (la saga solo creaba 5
env vars), y la web exige esa clave para validar el token HMAC de `/preview-admin`
(sin ella → 404). Además, la service key se creaba como `encrypted` (Config), lo que
dispara el badge "needs attention" de Vercel.

**Fixes (`bfb47c5`):**
- `upsertEnv(..., type)`: POST/PATCH con `type` (`encrypted` = Config,
  `sensitive` = **Secret**). La service key se crea como Secret desde el origen.
- `stepVercelEnv` ahora provisiona **7** env vars: las 5 previas + `PREVIEW_SIGNING_KEY`
  (Secret, desde el admin) + `ADMIN_ORIGIN` (CSP `frame-ancestors` del preview).
- Guard: si falta `PREVIEW_SIGNING_KEY`/`ADMIN_ORIGIN` en el admin → warning, no fatal.

**Nota de tipos (Vercel Config/Secret, 24-ago-2026):** "Secret" = valor disponible
en build y runtime pero no releíble (`type=sensitive` por API). La política
"Separate Production Secret Values" es de **team**, no aplica en cuenta personal;
queda anotada para cuando se migre a un plan con team.

**Remediación de `colegio-yachay`:** PATCH del service key a Secret + POST de
`PREVIEW_SIGNING_KEY`/`ADMIN_ORIGIN` + redeploy. Verificado: `/preview-admin` con
token válido → 200; sin token → 404. La previsualización en el panel requiere además
que resuelva el DNS (el iframe usa `preview_web_url`).
