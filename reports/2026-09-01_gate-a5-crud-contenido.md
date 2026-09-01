# GATE A5 — Panel admin: CRUD de contenido editorial (autoridades, galería, niveles, admisiones, contacto)

> **Creado:** 2026-09-01
> **Proyecto:** WEB-MODELO-1
> **Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (tabla `contenido` JSONB + Storage bucket `media`)
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** [✓] COMPLETADO

---

## Plan original

Completar los 5 módulos de contenido editorial del panel admin (`apps/admin`) que hoy están como "módulo en construcción". Todos escriben sobre la tabla `contenido` (clave → valor JSONB por tenant) ya creada en el GATE A1, con RLS ya activa (lectura por tenant, escritura solo admin del tenant). Los uploads de imágenes van al bucket `media` con rutas por sección (`autoridades/`, `galeria/`).

Tareas (cada una es un paso independiente):

1. **Autoridades** — CRUD de directivos: nombre, cargo, foto (upload), bio. Clave `autoridades` (array `[{name, role, image, bio?}]`).
2. **Galería** — CRUD de imágenes: título, categoría, imagen (upload), alt, orden. Clave `galeria` (array `[{src, alt, variant, title?, category?, order?}]`).
3. **Niveles** — Editar descripción, edad y CTA por nivel. Clave `niveles` (objeto `{preescolar, primaria, secundaria, media-tecnica}`).
4. **Admisiones** — Editar periodo, requisitos (lista), cronograma (lista), FAQ (lista). Clave `admisiones` (`{schedule[], requirements[], faq[]}`).
5. **Contacto** — Editar dirección, teléfono, email, horario, mapa. Clave `contacto` (`{departments[], formFields[]}`).

**CRITERIO DE ACEPTACIÓN (GATE A5):**
- CRUD completo por sección con RLS (escritura solo admin del tenant, lectura por tenant).
- Uploads a Storage con rutas correctas (`galeria/`, `autoridades/`).

**Contexto técnico:**
- Patrón a replicar: módulos `textos` y `portada` (server action `upsertContenido` con `onConflict: "tenant_id,clave"`, formularios client con `useActionState`, `requireAdmin()` para sesión+tenant).
- Storage: bucket `media`, helper `mediaUrl()` en `lib/storage.ts`, upload con `supabase.storage.from("media").upload(path, file, { upsert: true })`.
- La web (Astro) valida cada clave con zod y cae a fallback si no pasa; los campos extra del JSONB se ignoran, así que añadir campos opcionales (bio, category, title, order, periodo) NO rompe la web. Se conservan los campos que la web consume.

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Autoridades: CRUD (nombre, cargo, foto, bio) | [✓] Completado | sin commit | 🟡 | Build OK. Usuario eligió skip |
| 2 | Galería: CRUD (título, categoría, imagen, alt, orden) | [✓] Completado | sin commit | 🟡 | Build OK. Usuario eligió skip |
| 3 | Niveles: editar descripción/edad/CTA por nivel | [✓] Completado | sin commit | 🟡 | Build OK. Usuario eligió skip |
| 4 | Admisiones: editar periodo, requisitos, cronograma, FAQ | [✓] Completado | sin commit | 🟡 | Build OK. Usuario eligió skip |
| 5 | Contacto: editar dirección, teléfono, email, horario, mapa | [✓] Completado | sin commit | 🟡 | Build OK. Usuario eligió skip |

---

## Registro de commits

_(Se llenará conforme avance la ejecución)_

---

## Incidentes y desvíos

- **2026-09-01 · Paso 1:** Usuario eligió `skip` — el Paso 1 queda sin commit. Los cambios (actions.ts, autoridades-form.tsx, page.tsx) quedan en el working tree.
- **2026-09-01 · Paso 1:** La tarea pide campo `bio` que la web no consume aún. Se agrega como opcional en el JSONB (la web ignora campos extra).
- **2026-09-01 · Paso 2:** Usuario eligió `skip` — el Paso 2 queda sin commit. Los cambios (actions.ts, galeria-form.tsx, page.tsx) quedan en el working tree.
- **2026-09-01 · Paso 2:** La tarea pide campos `title`, `category`, `order` que la web no consume aún. Se agregan como opcionales en el JSONB (la web ignora campos extra).
- **2026-09-01 · Paso 3:** Usuario eligió `skip` — el Paso 3 queda sin commit. Los cambios (actions.ts, niveles-form.tsx, page.tsx) quedan en el working tree.
- **2026-09-01 · Paso 3:** La tarea pide campo `edad` que no está en el shape de `niveles` (la edad vive en `site.config.ts` como `ageRange`). Se agrega `ageRange` como opcional por nivel en el JSONB (la web ignora campos extra).
- **2026-09-01 · Paso 4:** Usuario eligió `skip` — el Paso 4 queda sin commit. Los cambios (actions.ts, admisiones-form.tsx, page.tsx) quedan en el working tree.
- **2026-09-01 · Paso 4:** La tarea pide campo `periodo` que no está en el shape de `admisiones` (el periodo vive en `site.config.ts` como `periodLabel`). Se agrega `periodLabel` como opcional en el JSONB (la web ignora campos extra).
- **2026-09-01 · Paso 5:** Usuario eligió `skip` — el Paso 5 queda sin commit. Los cambios (actions.ts, contacto-form.tsx, page.tsx) quedan en el working tree.
- **2026-09-01 · Paso 5:** La tarea pide campos dirección/teléfono/email/horario/mapa que no están en el shape de `contacto` (viven en `site.config.ts`). Se agregan bajo un objeto `info` opcional en el JSONB (la web ignora campos extra).
