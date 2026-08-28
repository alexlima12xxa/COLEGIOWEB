# GATE 1 — White-label base: config + validación + tokens + SEOHead

> **Creado:** 2026-08-28
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro 7.2.9 + Tailwind CSS v4 + TypeScript strict + pnpm
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** 🟡 EN PROGRESO

---

## Plan original

1. Crear `src/site.config.ts` con esquema zod: identidad, contacto, redes, niveles, secciones (flags), admisiones, branding (colores/fuentes/radius), seo, supabase.
2. Script de validación en build (`src/shared/lib/validateConfig.ts`):
   - contraste WCAG >= 4.5:1 sobre colores configurados (falla el build si no cumple)
   - formato WhatsApp internacional (regex)
   - URLs de assets existentes en `public/branding/`
   - longitud máxima de textos críticos (nombre <= 40, lema <= 80)
3. Mapear tokens CSS a tailwind.config (colores/fuentes/spacing/radius vía custom properties).
   PROHIBIDO: valores crudos fuera de `_tokens.css`, `!important`, inline styles.
4. Crear `src/shared/layouts/SEOHead.astro`: title, meta description, Open Graph, Twitter Cards, JSON-LD base (`EducationalOrganization`) — todo desde `site.config.ts`.

---

## Criterio de aceptación (GATE 1)

- Cambiar colores/nombre en el config y hacer build → toda la marca cambia sin tocar componentes.
- Forzar un color con contraste insuficiente → el build falla con mensaje claro.

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Crear `src/site.config.ts` con esquema Zod | ⏳ Pendiente | — | 🟡 MODERADO | — |
| 2 | Crear `src/shared/lib/validateConfig.ts` e integrar en build | ⏳ Pendiente | — | 🟠 COMPLEJO | Incluye contraste WCAG, WhatsApp, assets, longitudes |
| 3 | Mapear tokens CSS a Tailwind v4 vía `@theme inline` | ⏳ Pendiente | — | 🟡 MODERADO | Sin valores crudos, `!important` ni inline styles |
| 4 | Crear `src/shared/layouts/SEOHead.astro` | ⏳ Pendiente | — | 🟡 MODERADO | Title, meta, OG, Twitter Cards, JSON-LD EducationalOrganization |

---

## Registro de commits

_(Se llenará conforme avance la ejecución)_

---

## Incidentes y desvíos

_(Vacío al inicio. Se registra cualquier problema encontrado durante la ejecución)_
