# Corrección de bugs y código muerto (auditoría 2026-09-15)

> **Creado:** 2026-09-15
> **Proyecto:** WEB-MODELO-1 (monorepo pnpm multi-colegio)
> **Stack:** Astro (web) · Next.js 16 (admin) · Supabase · TypeScript
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** ✅ COMPLETADO (2026-09-15)

---

## Plan original

### Objetivo
Eliminar los hallazgos de seguridad confirmados por la auditoría, consolidar el helper de imágenes duplicado y retirar el código muerto verificado, sin alterar el comportamiento editorial ni el pipeline de build.

### Decisiones del usuario (2026-09-15)
1. Fase 2 — unificar timeout de `isImageAccessible` a 2.5s en los 3 módulos (recomendado).
2. Fase 3 — umbral de subida de imágenes: **8 MB**.
3. Fase 4 — **conservar** `whatsapp.ts` (andamiaje potencial de feature leads→WhatsApp). Se eliminan solo `uuid.ts`, `clearRateLimit`, `isDbConfigured`.

### Pasos

**Fase 1 — Quick wins de seguridad**

1. **Open redirect** en `apps/admin/app/login/actions.ts:37`. Endurecer el guard para rechazar rutas protocol-relative (`//`) y backslash (`/\`).
2. **CSV injection** en `apps/admin/app/admin/leads/export/route.ts:15-21`. Neutralizar prefijos de fórmula (`=`, `+`, `-`, `@`, tab, CR) en `csvCell`.

**Fase 2 — Consolidación del helper de imágenes**

3. Crear `apps/web/src/shared/db/imageAccess.ts` con `isImageAccessible` (timeout 2.5s), `ensureAccessibleImage`, `IMAGE_FALLBACK` y caché único.
4. Migrar `content.ts` y `contenido.ts` para consumir el helper compartido.
5. Migrar `banners.ts` y `ContentImage.astro` para consumir el helper compartido.

**Fase 3 — Validación de subidas**

6. Añadir allowlist de MIME y límite de 8 MB en `subirImagenBanner`, `uploadOrKeep` y `uploadDataUrl` (`apps/admin/app/admin/banners/actions.ts`).

**Fase 4 — Código muerto**

7. Eliminar `apps/web/src/shared/lib/uuid.ts` (residuo de Decap CMS).
8. Eliminar `clearRateLimit` de `apps/web/src/shared/lib/rateLimit.ts`.
9. Eliminar `isDbConfigured` de `apps/web/src/shared/db/client.ts`.

### Fuera de alcance
- Rate limiting server-side (requiere decisión de infraestructura aparte).
- `whatsapp.ts` (conservado por decisión del usuario).
- `types.ts` / `tokens.ts` de `packages/shared` (contrato intencional, no código muerto).

### Puntos de validación
- Fase 1: `pnpm --filter @web-modelo/admin build` pasa. Prueba manual: `/login?next=//evil.com` aterriza en `/admin`. Lead con `=1+1` en `nombre` → exportado como texto.
- Fase 2: `pnpm --filter @web-modelo/web check` y `build` pasan. Comparación visual de `/noticias/[slug]` y home.
- Fase 3: `admin build` pasa. Prueba: subir `.txt` renombrado a `.jpg` y archivo > 8 MB → rechazados.
- Fase 4: `web check` y `build` pasan sin errores de símbolo faltante.

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Fix open redirect en login | ✅ Completado | `ae81da3` | 🟢 | — |
| 2 | Fix CSV injection en export de leads | ✅ Completado | `c213b89` | 🟢 | — |
| 3 | Crear helper compartido `imageAccess.ts` | ✅ Completado | `777cc56` | 🟡 | — |
| 4 | Migrar `content.ts` + `contenido.ts` al helper | ✅ Completado | `3b0978f` | 🟡 | — |
| 5 | Migrar `banners.ts` + `ContentImage.astro` al helper | ✅ Completado | `611afe2` | 🟡 | — |
| 6 | Validar MIME + tamaño 8MB en subidas de banner | ✅ Completado | `1ce4191` | 🟡 | Falta política de bucket (infra) |
| 7 | Eliminar `uuid.ts` | ✅ Completado | `4efca0a` | 🟢 | — |
| 8 | Eliminar `clearRateLimit` | ✅ Completado | `bb4b08e` | 🟢 | — |
| 9 | Eliminar `isDbConfigured` | ✅ Completado | `b95df22` | 🟢 | — |

---

## Registro de commits

| Commit | Mensaje | Paso |
|--------|---------|------|
| `ae81da3` | `fix(admin): bloquear open redirect en el login validando next` | 1 |
| `c213b89` | `fix(admin): neutralizar inyeccion de formulas en el export de leads` | 2 |
| `777cc56` | `refactor(web): crear helper compartido de accesibilidad de imagenes` | 3 |
| `3b0978f` | `refactor(web): migrar content.ts y contenido.ts al helper de imagenes` | 4 |
| `611afe2` | `refactor(web): migrar banners.ts y ContentImage.astro al helper de imagenes` | 5 |
| `1ce4191` | `fix(admin): validar tipo MIME y tamano en subidas de banner` | 6 |
| `4efca0a` | `chore(web): eliminar uuid.ts (residuo de Decap CMS)` | 7 |
| `bb4b08e` | `chore(web): eliminar clearRateLimit sin uso` | 8 |
| `b95df22` | `chore(web): eliminar isDbConfigured sin uso` | 9 |

---

## Incidentes y desvíos

_(Vacío al inicio. Se registra cualquier problema encontrado durante la ejecución)_

## Tareas de infraestructura pendientes (fuera del repo)

- **Política del bucket `media` en Supabase Storage**: restringir MIME permitidos
  (`image/jpeg`, `image/png`, `image/webp`, `image/avif`) y tamaño máximo (8 MB).
  La validación en `banners/actions.ts` es UX; el control robusto contra MIME
  falsificado es la política del bucket. Requiere acceso al proyecto Supabase.
- **Rate limiting server-side en formularios públicos**: fuera de alcance por
  decisión; requiere elección de infraestructura (API route + KV, trigger
  Postgres o CAPTCHA).