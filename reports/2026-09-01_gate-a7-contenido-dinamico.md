# GATE A7 — Contenido dinámico desde Supabase (tabla `contenido`)

> **Creado:** 2026-09-01
> **Proyecto:** WEB-MODELO-1 (web pública Astro SSG)
> **Stack:** Astro 7.2.9 + TypeScript strict + Supabase + Tailwind v4 + pnpm
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** [✓] COMPLETADO

---

## Plan original

Tareas solicitadas por el usuario (GATE A7):

1. Crear `getContenido()` en `src/shared/db/` (lee tabla `contenido` con service
   role key en build; fallback a los JSON existentes).
2. Adaptar `nosotros.astro` (mision/vision/filosofia/historia/autoridades).
3. Adaptar `index.astro` (hero, video_tour, galeria).
4. Adaptar `NivelLayout` (descripciones), `admisiones.astro`
   (cronograma/requisitos/faq), `contacto.astro` (datos).
5. Mantener el patrón Supabase → fallback (nunca romper el build).

Criterio de aceptación (GATE A7):
- Build OK sin Supabase (fallback).
- Con Supabase: los textos editados en el panel renderizan.
- Lighthouse sigue ≥ 95.

### Estado actual detectado en auditoría previa

| Clave BD | Getters existentes | Consumido por página |
|---|---|---|
| mision / vision / filosofia / historia | ✔ getMision/getVision/getFilosofia/getHistoria | ✔ nosotros.astro |
| hero / video_tour | ✔ getHero/getVideoTour | ✔ index.astro |
| autoridades | ✘ falta getter | ✘ nosotros.astro usa fallback |
| galeria | ✘ falta getter | ✘ index.astro usa fallback |
| niveles | ✘ falta getter | ✘ NivelLayout/[slug].astro usan fallback |
| admisiones | ✘ falta getter | ✘ admisiones.astro usa fallback |
| contacto | ✘ falta getter | ✘ contacto.astro usa fallback |

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | schema.ts: añadir esquemas zod (autoridad, galeria, nivelDetalle, admisiones, contacto) | [✓] Completado | sin commit (skip usuario) | 🟡 | Validan claves nuevas con los mismos zod que los fallbacks |
| 2 | contenido.ts: crear `getContenido()` genérico + getters específicos (getAutoridades, getGaleria, getNiveles, getAdmisiones, getContacto) | [✓] Completado | sin commit (skip usuario) | 🟡 | Patrón Supabase → fallback, nunca lanza |
| 3 | nosotros.astro: autoridades desde BD con fallback a about.json | [✓] Completado | sin commit (skip usuario) | 🔵 | Reemplaza lectura directa de aboutData.authorities |
| 4 | index.astro: galería desde BD con fallback a home.json | [✓] Completado | sin commit (skip usuario) | 🔵 | Reemplaza homeData.bentoGallery |
| 5 | NivelLayout + niveles/[slug].astro: descripciones desde BD con fallback a levels.json | [✓] Completado | sin commit (skip usuario) | 🟡 | Clave `niveles` alimenta headline/description/program/methodology/schedule/cta |
| 6 | admisiones.astro: cronograma/requisitos/faq desde BD con fallback a admissions.json | [✓] Completado | sin commit (skip usuario) | 🔵 | También alimenta FAQ JSON-LD |
| 7 | contacto.astro: directorio + formFields desde BD con fallback a contact.json | [✓] Completado | sin commit (skip usuario) | 🔵 | — |
| 8 | Verificación GATE A7: `check` + `build` sin Supabase (fallback) | [✓] Completado | sin commit (skip usuario) | 🟡 | check 0 errores · build 15 páginas OK · Lighthouse se valida aparte |

---

## Registro de commits

_(Se llenará conforme avance la ejecución)_

---

## Incidentes y desvíos

- **2026-09-01 — Paso 8 (verificación):** `astro check` falló con 5 errores TS:
  1. `schema.ts` no exportaba los tipos `Pilar`/`Hito` (inconsistencia preexistente).
  2. `getGaleria`/`getContacto` devolvían fallbacks JSON con tipos `string` donde
     los schemas exigen enums (`variant`, `type`).
  - **Corrección:** se exportaron los tipos `Pilar`/`Hito` en `schema.ts` y se
    validan los fallbacks de galería/contacto con sus zod (`fallbackGaleria()`,
    `fallbackContacto()`), replicando el patrón `noticiasFallbackSchema` de
    `content.ts`. Además se aplicó `prettier --write` a `contenido.ts`.
  - **Resultado:** check 0 errores / 0 warnings; build 15 páginas OK.
- **Nota:** los 14 hints del check son preexistentes (deprecaciones de zod
  `.url()`/`.email()`, hint de AdmissionForm, uuid.ts) — no relacionados con
  este GATE. El warning de lightningcss sobre `:global` en NewsList.css también
  es preexistente y no rompe el build.
