# Modelo multi-colegio (white-label escalable)

> **Creado:** 2026-09-02
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro SSG + Next.js + Supabase multi-tenant + Vercel
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** 🟡 EN PROGRESO

---

## Plan original

### Objetivo
Permitir que el mismo código sirva N colegios independientes (cada uno con su dominio, colores, logo y contenido), manteniendo SSG puro, un solo Supabase multi-tenant y un solo panel admin — con automatización para escalar de 1 a 50 colegios.

### Arquitectura objetivo
1 repo ── 1 Supabase (N tenants) ── 1 panel admin (todos los directores)
                │
        ┌───────┼───────────┬───────────┐
     web c1   web c2   ...  web cN      (N proyectos Vercel, N dominios)
Marca (colores, logo, identidad, SEO) → código: `apps/web/src/configs/<slug>.ts` + `public/branding/<slug>/`
Contenido → Supabase por tenant_id (ya listo)
Rebuild → webhook por tenant (el director reconstruye solo su web)
Alta de colegio → script automatizado

### Pasos

**FASE 1 — Config por colegio (web)**

- **P1.1** Crear `apps/web/src/configs/colegio-piloto.ts` — exporta el objeto con los valores actuales de site.config.ts (identity, contact, social, levels, sections, admissions, branding, seo, supabase). Sin schema, solo datos.
- **P1.2** Convertir `site.config.ts` en cargador (mantiene el schema y el export siteConfig):
  - `import.meta.glob("./configs/*.ts", { eager: true })`
  - Selecciona `configs/<PUBLIC_SITE_SLUG>.ts` (env var); fallback a colegio-piloto
  - Valida con `siteConfigSchema.parse()` y exporta siteConfig
  - Los 21 imports existentes siguen funcionando sin tocar nada (mismo símbolo)
- **P1.3** Assets: mantener `public/branding/` actual para el piloto (sin migración de archivos). Los configs de colegios nuevos referencian `/branding/<slug>/...`. validateConfig.ts ya valida la existencia de assets por build.
- **P1.4** Validar: `pnpm --filter @web-modelo/web check && build` con slug piloto → mismo resultado que hoy.

**FASE 2 — Rebuild por tenant (admin + BD)**

- **P2.1** Migración SQL `supabase/migrations/20260902000000_tenant_settings.sql`:
  - Tabla `tenant_settings` (`tenant_id` uuid PK → colegios, `rebuild_hook_url` text)
  - RLS: select/update solo admin del tenant (evita que anon lea el hook URL vía X-Tenant-Id)
  - Grants: select/update a authenticated; todo a service_role
- **P2.2** Refactor `apps/admin/lib/rebuild.ts`:
  - `triggerRebuild(supabase, tenantId)` → lee `rebuild_hook_url` de `tenant_settings` del tenant
  - Fallback a env `REBUILD_HOOK_URL` si no hay registro (compatibilidad)
- **P2.3** Actualizar los 9 archivos `actions.ts` que llaman `triggerRebuild()` (noticias, circulares, textos, portada, contacto, niveles, galeria, autoridades, admisiones) para pasar `supabase`, `tenantId` (ya los obtienen de `requireAdmin()`).
- **P2.4** Validar: `pnpm --filter @web-modelo/admin build`.

**FASE 3 — Catálogo y onboarding automatizado**

- **P3.1** Crear `clients.json` (raíz) — catálogo de colegios:
  ```json
  [{ "slug": "colegio-1", "domain": "colegio1.com", "tenantId": "",
     "adminEmail": "director@colegio1.com", "rebuildHookUrl": "" }]
  ```
- **P3.2** Crear `scripts/colegio-alta.mjs` (Node, service role + Vercel CLI):
  - Inserta el colegio en `colegios`
  - Crea el usuario admin en Supabase Auth con `app_metadata { role: "admin", tenant_id }`
  - Siembra las 11 claves de contenido (plantilla parametrizada del seed_contenido.sql)
  - Inserta `tenant_settings.rebuild_hook_url`
  - Crea el proyecto Vercel web (rootDirectory `apps/web`), setea env vars (`PUBLIC_TENANT_ID`, `PUBLIC_SITE_SLUG`, Supabase URL/keys), agrega dominio y crea deploy hook
- **P3.3** Crear `package.json` raíz (privado) con script `colegio:alta`.

**FASE 4 — Guía y documentación**

- **P4.1** Crear `docs/multi-colegio.md`: pasos por colegio (env vars, Ignored Build Step por proyecto para que un push solo reconstruya los colegios afectados, dominio, webhook).
- **P4.2** Actualizar `.agents/PROJECT.md` (modelo multi-colegio, decisión de marca en código) y `AGENTS.md` si aplica.

### Archivos involucrados

| Archivo | Rol |
|---|---|
| `apps/web/src/site.config.ts` | Se convierte en cargador (schema + selección por slug) |
| `apps/web/src/configs/colegio-piloto.ts` | Nuevo — config del piloto (valores actuales) |
| `apps/web/src/configs/<slug>.ts` | Nuevos — config por colegio |
| `apps/web/public/branding/<slug>/` | Assets por colegio (nuevos colegios) |
| `supabase/migrations/20260902000000_tenant_settings.sql` | Nuevo — tabla + RLS |
| `apps/admin/lib/rebuild.ts` | Refactor — hook por tenant |
| `apps/admin/app/admin/*/actions.ts` (9) | Pasar supabase, tenantId a triggerRebuild |
| `clients.json` | Nuevo — catálogo de colegios |
| `scripts/colegio-alta.mjs` | Nuevo — onboarding automatizado |
| `package.json` (raíz) | Nuevo — script colegio:alta |
| `docs/multi-colegio.md` | Nuevo — guía de operación |
| `.agents/PROJECT.md` | Actualizar modelo |

### Trade-offs
- **Ventajas:** SSG puro intacto (un build por colegio); aislamiento total; marca en código versionada/validada; escala a 50 con automatización; un solo Supabase y panel admin.
- **Riesgos/compromisos:** N proyectos Vercel (mitigado con script); cada push reconstruye todos (mitigado con Ignored Build Step); Vercel Pro para >3 proyectos; refactor toca 9 archivos.
- **Alternativas descartadas:** marca editable desde el panel (NO), un solo proyecto multi-dominio (rompe SSG).

### Riesgos identificados
- `import.meta.glob` en Astro: funciona en build (Vite), validar fallback a colegio-piloto.
- validateConfig por build: un colegio con contraste fallido rompe solo su build (deseado).
- Seed hardcodeado: seed_contenido.sql es del piloto — el script debe parametrizarlo.
- 9 llamadas a triggerRebuild: verificar con grep que ninguna quede sin actualizar.
- Vercel CLI: auth y permisos de team — documentar.
- Costos al crecer.

### Puntos de validación
- F1: build web con slug piloto = mismo resultado que hoy (check + build OK).
- F2: build admin OK; prueba manual hook por tenant.
- F3: script crea colegio de prueba end-to-end.
- F4: docs revisadas y PROJECT.md actualizado.

### Fuera de alcance
Marca editable desde el panel (NO); migrar a build multi-tenant (Camino 2); aula virtual (Fase 3); migración de datos de colegios existentes.

### Checklist de trabajo (commits atómicos)
1. `feat(web): cargar config por PUBLIC_SITE_SLUG con fallback al piloto (P1.1 + P1.2)`
2. `feat(db): tabla tenant_settings con RLS admin-only (P2.1)`
3. `refactor(admin): triggerRebuild por tenant con fallback a env var (P2.2)`
4. `refactor(admin): pasar supabase y tenantId a triggerRebuild en 9 actions (P2.3)`
5. `feat(ops): catalogo clients.json y script de alta de colegio (P3.1 + P3.2 + P3.3)`
6. `docs: guia multi-colegio y actualizar PROJECT.md (P4.1 + P4.2)`

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| P1.1 | Crear `configs/colegio-piloto.ts` (datos actuales) | [✓] Completado | `0131d5f` | 🟢 | Datos copiados del objeto actual site.config.ts |
| P1.2 | Convertir `site.config.ts` en cargador por slug | [✓] Completado | `0131d5f` | 🟡 | import.meta.glob eager; fallback piloto; 21 imports intactos |
| P1.3 | Assets: confirmar branding piloto actual | [✓] Completado | — (sin cambios) | 🟢 | Todos los assets referenciados existen; sin migración |
| P1.4 | Validar F1: check + build web slug piloto | [✓] Completado | `f920b4a` | 🟢 | check OK (0 errores) + build OK (13 páginas) |
| P2.1 | Migración `tenant_settings.sql` + RLS | [✓] Completado | `47b9beb` | 🟡 | Tabla mínima (tenant_id PK + rebuild_hook_url); select/update solo admin; grants authenticated + service_role |
| P2.2 | Refactor `triggerRebuild(supabase, tenantId)` | [✓] Completado | (commit atómico P2.2+P2.3) | 🟡 | Lee tenant_settings.rebuild_hook_url; fallback REBUILD_HOOK_URL; nunca lanza |
| P2.3 | Actualizar 9 `actions.ts` con supabase, tenantId | [✓] Completado | (commit atómico P2.2+P2.3) | 🟠 | 16/16 llamadas actualizadas (grep verificado); textos y portada requieren requireAdmin() extra |
| P2.4 | Validar F2: build admin | ⏳ Pendiente | — | 🟢 | Ejecuta usuario |
| P3.1 | Crear `clients.json` (catálogo) | ⏳ Pendiente | — | 🟢 | — |
| P3.2 | Crear `scripts/colegio-alta.mjs` | ⏳ Pendiente | — | 🟠 | Vercel CLI + service role |
| P3.3 | `package.json` raíz + script `colegio:alta` | ⏳ Pendiente | — | 🟢 | — |
| P4.1 | Crear `docs/multi-colegio.md` | ⏳ Pendiente | — | 🟡 | — |
| P4.2 | Actualizar `.agents/PROJECT.md` (+ AGENTS.md) | ⏳ Pendiente | — | 🟢 | — |

---

## Registro de commits

- `0131d5f` — feat(web): cargar config por PUBLIC_SITE_SLUG con fallback al piloto (P1.1 + P1.2)
- `f920b4a` — fix(web): eliminar funcion no usada y formatear site.config.ts (P1.4)
- `47b9beb` — feat(db): tabla tenant_settings con RLS admin-only (P2.1)

---

## Incidentes y desvíos

- 2026-09-02: P1.1 sin commit propio. El checklist del plan agrupa P1.1+P1.2 en un solo commit atómico (`feat(web): cargar config por PUBLIC_SITE_SLUG...`). El commit se propone al cerrar P1.2.
- 2026-09-02: P1.4 — `astro check` falló 2 veces: (1) ESLint por `slugFromPath` no usada (eliminada), (2) Prettier por formato (corregido con `prettier --write`). Build final OK: 13 páginas.
- 2026-09-02: P2.2+P2.3 se agrupan en UN solo commit atómico por decisión del usuario (evita estado intermedio roto: los 9 actions.ts llamaban triggerRebuild() sin argumentos). En textos y portada, `triggerRebuild` no tenía supabase/tenantId en scope → se agregó `requireAdmin()` antes de cada llamada.
