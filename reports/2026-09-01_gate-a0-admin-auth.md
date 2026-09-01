# GATE A0 — Panel admin: auth Supabase (login, protección de rutas, tenant)

> **Creado:** 2026-09-01
> **Proyecto:** WEB-MODELO-1
> **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase Auth + SSR
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** 🟡 EN PROGRESO

---

## Plan original

Crear la capa de autenticación del panel admin (`apps/admin`) sobre la MISMA BD Supabase multi-tenant ya existente (tablas `colegios`, `noticias`, `circulares`, `leads` + RLS con `is_admin()` y `current_tenant_id()`).

Tareas:
1. Verificar/ajustar esqueleto Next.js (App Router, TypeScript, Tailwind) en `apps/admin` con pnpm.
2. Instalar/verificar `@supabase/supabase-js` y `@supabase/ssr`.
3. Configurar Supabase Auth (email/password) con cookies.
4. Crear middleware de protección: rutas `/admin/*` requieren sesión.
5. Crear página de login (email + password) y logout.
6. Deploy inicial a Vercel (proyecto `admin.tuapp.com`).

**CRITERIO DE ACEPTACIÓN (GATE A0):**
- Login con un usuario admin creado en Supabase funciona.
- Rutas protegidas redirigen a `/login` sin sesión.
- El usuario autenticado ve su tenant (no otro).

**Contexto de BD (migración `20260828000000_init.sql`):**
- `is_admin()` → `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`
- `current_tenant_id()` → `auth.jwt() -> 'app_metadata' ->> 'tenant_id'`
- RLS: lectura por tenant, escritura solo admin del tenant.
- El usuario admin debe tener `app_metadata.role = 'admin'` y `app_metadata.tenant_id` fijados (vía dashboard o trigger).

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Verificar esqueleto Next.js admin + deps Supabase | [✓] Completado | `67ca56d` | 🟢 | Build OK. ⚠️ middleware deprecado → usar proxy (Next 16.3.3) |
| 2 | Configurar Supabase Auth con cookies (client/server/middleware) | [✓] Completado | `5b161ba` | 🟡 | client.ts/server.ts OK. Nuevo helper middleware.ts |
| 3 | Middleware de protección de rutas /admin/* | [✓] Completado | `08a4ad4` | 🟡 | Migrado a proxy.ts (Next 16). Build OK |
| 4 | Página de login (email+password) + logout | [✓] Completado | `08a4ad4` | 🟡 | /login + server actions login/logout. Build OK |
| 5 | Página protegida que muestra el tenant del usuario | [✓] Completado | `103fb33` | 🟡 | /admin dashboard + RLS colegios. Build OK |
| 6 | Build de validación + deploy inicial a Vercel | [✓] Completado | `b82c63c` | 🟠 | Deploy READY. Pendiente: verificación GATE A0 + dominio |

---

## Registro de commits

- `67ca56d` — chore(admin): esqueleto Next.js 16 + Supabase SSR (base GATE A0)
- `5b161ba` — feat(admin): helper de sesión Supabase SSR reutilizable
- `08a4ad4` — feat(admin): proxy de protección de rutas + página de login (Pasos 3+4)
- `103fb33` — feat(admin): dashboard protegido que muestra el tenant del usuario
- `d44c371` — chore(admin): vercel.json con framework nextjs + pnpm install
- `b82c63c` — chore(admin): eliminar vercel.json (config en dashboard de Vercel)

---

## Verificación GATE A0 (deploy en producción)

- URL: `https://admin-alejandro25.vercel.app` (dominio por defecto de Vercel; `admin.tuapp.com` es placeholder y no existe)
- `/login` → 200, página real ("Iniciar sesión — Panel Admin") ✅
- `/admin` sin sesión → 307 redirect a `/login?next=%2Fadmin` ✅ (criterio "rutas protegidas redirigen a /login")
- Login con usuario admin: **pendiente** — requiere usuario admin real en Supabase con `app_metadata.role = 'admin'` y `app_metadata.tenant_id`
- El usuario autenticado ve su tenant: **pendiente** — requiere login real
- Protección SSO de Vercel: **desactivada** (para permitir acceso al panel; el panel usa su propia auth Supabase)

---

## Incidentes y desvíos

- **2026-09-01 · Paso 1:** Next.js 16.3.3 depreca la convención `middleware` en favor de `proxy`. Se usará `proxy.ts` en el Paso 3 para la protección de rutas.
- **2026-09-01 · Paso 3:** Migrado `middleware.ts` → `proxy.ts`. `updateSession()` ahora devuelve `{ supabaseResponse, user }` para que el proxy valide el JWT con `getUser()` (en lugar de un atajo por cookies).
- **2026-09-01 · Paso 3:** Usuario eligió `skip` — el Paso 3 queda sin commit. Los cambios (proxy.ts, middleware.ts helper, eliminación de middleware.ts) quedan en el working tree y se incluirán en un commit posterior.
- **2026-09-01 · Paso 4:** Usuario eligió `skip` — el Paso 4 queda sin commit. Los cambios (login page, login-form, actions) quedan en el working tree.
- **2026-09-01 · Paso 6:** Deploy por git push falló inicialmente ("No Next.js version detected"). Causa: el proyecto `admin` no estaba registrado en `.vercel/repo.json` de la raíz y el deploy por git push no aplicaba el rootDirectory. Solución: deploy manual desde la raíz con `--project admin` funcionó; el deploy por git push quedó funcional tras el commit `b82c63c`. Deploy READY en `admin-94eeaoz9u-alejandro25.vercel.app`.
- **2026-09-01 · Paso 6:** Pendiente de verificación funcional del GATE A0 (login con usuario admin real, redirección de rutas protegidas, tenant correcto) y configuración del dominio `admin.tuapp.com`.
- **2026-09-01 · Skills:** `nextjs-app-router-patterns` y `nextjs-supabase-auth` (referenciados en resumen.md) no están instalados en este entorno. Se procede con skill `react` + patrones oficiales Supabase SSR.
