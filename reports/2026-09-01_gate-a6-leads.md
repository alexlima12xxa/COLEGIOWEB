# GATE A6 — Panel admin: Módulo de Leads (listado, filtros, cambio de estado, exportar CSV)

> **Creado:** 2026-09-01
> **Proyecto:** WEB-MODELO-1
> **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (tabla `leads` + RLS)
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** [✓] COMPLETADO

---

## Plan original

Completar el módulo de Leads del panel admin (`apps/admin`). Hoy la página `apps/admin/app/admin/leads/page.tsx` es solo un placeholder que muestra el conteo de leads. La tabla `leads` ya existe en Supabase con RLS (select/update solo admin del tenant) y el formulario público de admisiones ya persiste los leads con `estado: 'nuevo'`.

Tareas (cada una es un paso independiente):

1. **Listado con filtros** — Página Leads con tabla de leads y filtros por estado, nivel y fecha. Columnas: nombre, email, teléfono, nivel de interés, estado, fecha. Filtros: estado (nuevo/contactado/cerrado), nivel (Preescolar/Primaria/Secundaria/Media Técnica), fecha (desde/hasta).
2. **Cambiar estado** — Acción para avanzar el estado de un lead: nuevo → contactado → cerrado. Server action con `requireAdmin()` + RLS (solo admin del tenant).
3. **Exportar CSV** — Botón para descargar los leads filtrados en CSV (UTF-8 con BOM para Excel).

**CRITERIO DE ACEPTACIÓN (GATE A6):**
- Los leads del formulario público aparecen en el panel.
- Solo los leads del tenant del director (RLS).

**Contexto técnico:**
- Patrón a replicar: módulos `circulares`/`noticias` (server component con `requireAdmin()`, server actions con `"use server"`, `ModuleCard`, estilos Tailwind zinc/blue).
- Tabla `leads`: `id`, `tenant_id`, `nombre`, `email`, `telefono`, `nivel_interes`, `mensaje`, `origen`, `estado` (default 'nuevo'), `created_at`.
- RLS ya activa: `leads_select_admin` (select solo admin del tenant), `leads_update_admin` (update solo admin del tenant). El cliente de `requireAdmin()` ya pasa por RLS.
- `nivel_interes` guarda el NOMBRE del nivel (ej. "Preescolar", "Media Técnica") porque el formulario usa `getLevelName()`.
- Estados: `nuevo`, `contactado`, `cerrado`.

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Listado con filtros (estado, nivel, fecha) | [✓] Completado | 6547925 | 🟡 | Build OK |
| 2 | Cambiar estado (nuevo → contactado → cerrado) | [✓] Completado | 6547925 | 🟡 | Build OK |
| 3 | Exportar CSV | [✓] Completado | 6547925 | 🟡 | Build OK |

---

## Registro de commits

- `6547925` — feat(admin): modulo de leads (listado con filtros, cambio de estado, exportar CSV) — commit único con los 3 pasos (7 archivos).

---

## Incidentes y desvíos

- **2026-09-01 · Paso 1:** Error de build inicial — `leads-filters.tsx` (Client Component) importaba constantes desde `./page` (Server Component), arrastrando `next/headers` al bundle del cliente. Corregido extrayendo constantes/tipos compartidos a `leads-constants.ts` (sin dependencias de servidor). Build OK tras la corrección.
- **2026-09-01 · Paso 1:** Usuario eligió `skip` — el Paso 1 queda sin commit. Los cambios (page.tsx, leads-filters.tsx, leads-table.tsx, leads-constants.ts) quedan en el working tree.
- **2026-09-01 · Paso 2:** Usuario eligió `skip` — el Paso 2 queda sin commit. Los cambios (actions.ts, lead-estado-button.tsx, leads-table.tsx, leads-constants.ts) quedan en el working tree.
- **2026-09-01 · Paso 3:** Usuario eligió `skip` — el Paso 3 queda sin commit. Los cambios (export/route.ts, leads-filters.tsx) quedan en el working tree.
