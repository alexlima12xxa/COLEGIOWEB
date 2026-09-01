# PROJECT.md
> Generado por el agente de planificación. Modificar solo vía propuesta del agente.
> Creado: 2026-08-27 | Actualizado: 2026-08-27 | Motivo: Inicio de construcción (GATE 0)

## Origen
- Tipo: nuevo (directorio vacío, solo `.git/`)
- Archivos usados para inferencia: ninguno (proyecto en planificación)
- Decisiones de arquitectura tomadas en sesión de auditoría (2026-08-27)

## Stack
- Lenguaje principal: TypeScript (strict)
- Framework: Astro 7.2.9 (Modo Estático / SSG) — instalado 2026-08-27
- Estilos: Tailwind CSS (v4, vía plugin Vite) con variables CSS para tokens
- Gestor de paquetes: pnpm (v11.18.0)
- Base de datos: Supabase (Postgres, multi-tenant con RLS)
- CMS: Decap CMS (edición no-técnica para el colegio)
- Iconos: @lucide/astro (lucide-astro está deprecated)
- Deploy: Vercel (web pública + futuro aula virtual Next.js) — adapter @astrojs/vercel instalado
- Dominio: Cloudflare Registrar (DNS central)

## Arquitectura
- Monorepo pnpm (workspaces): `apps/*` + `packages/*`
  - `apps/web` → Astro SSG (web pública) en `tuapp.com` (Vercel)
  - `apps/admin` → Next.js (panel admin, Fase 2) en `admin.tuapp.com` (Vercel)
  - `apps/aula` → Next.js (aula virtual, Fase 3) en `aula.tuapp.com` (Vercel)
  - `packages/shared` → tipos BD Supabase + tokens de marca compartidos
- BD compartida: Supabase (una BD, tablas con `tenant_id` + RLS)
- Sesión entre subdominios: Opción B (login propio en cada app) — decidida para MVP

## Mapa de responsabilidades
- `apps/web/src/site.config.ts` → fuente de verdad del white-label (zod en build)
- `apps/web/src/styles/` → sistema de capas CSS (`_tokens.css`, `_reset.css`, `_base.css`, `_layers.css`, `_fonts.css`, `_utilities.css`, `global.css`)
- `apps/web/src/shared/` → componentes UI, layouts, lib, db client
- `apps/web/src/features/` → componentes por feature (noticias, levels, admissions)
- `apps/web/src/pages/` → rutas públicas (15 páginas)
- `apps/web/src/data/fallback/` → JSON versionados (resiliencia sin Supabase)
- `apps/web/public/branding/` → assets por colegio
- `supabase/migrations/` → esquema multi-tenant + RLS (init + grant service role)
- `supabase/functions/rebuild-webhook/` → Edge Function Supabase → Vercel deploy hook
- `packages/shared/` → tipos y tokens compartidos entre apps

## Convenciones detectadas (decididas en planificación)
- Mobile-first estricto (70%+ tráfico móvil)
- Clases BEM en CSS externo; componentes PascalCase; utilidades camelCase
- Prohibido: valores crudos de color/spacing fuera de `_tokens.css`, `!important`, inline styles
- Prohibido: escribir `@media` manual con valores crudos — usar breakpoints nativos de Tailwind v4 (`--breakpoint-*` en `@theme`) y variantes responsive (`md:`, `lg:`). Ver `src/styles/_tokens.css`.
- Prohibido: fetch en cliente para contenido indexable (SSG + webhook rebuild)
- Prohibido: service role key de Supabase en el navegador (solo build-time)
- Formulario de leads: doble vía (persistir en Supabase → abrir WhatsApp)

## Restricciones (decisiones que NO se cuestionan)
- Vercel para las 3 apps (web pública + panel admin + aula virtual)
- Dominio comprado en Cloudflare Registrar
- pnpm como gestor de paquetes (monorepo workspaces)
- White-label 100% vía `site.config.ts` + tokens CSS (la agencia configura marca; el director edita contenido vía panel admin)
- Decap CMS ELIMINADO — Supabase es la única fuente de contenido editorial (con fallback JSON)
- Objetivo: 100/100 Google PageSpeed móvil

## Estado actual
- Monorepo creado: `apps/web` (Astro, movida), `apps/admin` y `apps/aula` (esqueletos Next.js), `packages/shared` (tipos + tokens). Las 3 apps compilan (validado).
- Web pública: GATE 8 en curso (producción, webhook, imágenes remotas). ~15 páginas, build OK, placeholders en site.config.ts (Supabase URL, dominio, nombre del colegio).
- Panel admin (Fase 2): plan A0-A8 definido (esqueleto listo; pendiente auth, CRUD, editor de textos, leads).
- Aula virtual (Fase 3): solo esqueleto + plan (notas por estudiante, cursos, RLS por relación familiar) — no planificada en detalle.
- Decap CMS eliminado; Netlify cancelado; no se necesita script sharp (astro:assets + remotePatterns cubren imágenes).
- `.agents/skills/resumen.md` documenta skills por fase.

## Decisiones clave
- SSG + fetch en build-time (no SSR, no fetch en cliente) para noticias/circulares
- Webhook Supabase → deploy hook de Vercel para rebuild (< 2 min)
- Multi-tenancy: una BD compartida con `tenant_id` + RLS en todas las tablas
- Validación de contraste WCAG ≥ 4.5:1 en build (falla si no cumple)
- Panel admin + aula virtual sobre la MISMA BD Supabase (apps separadas, login propio)
- Director edita TODO el contenido institucional (Opción 1: misión, visión, hero, video, autoridades, descripciones, galería) — la agencia solo configura marca/estructura

## Ambigüedades pendientes
- Nombre real del dominio (`tuapp.com` / `colegioweb.vercel.app` son placeholders)
- Datos reales del colegio piloto (nombre, colores, niveles, contacto)
- Supabase real aún en placeholder (`https://placeholder.supabase.co`) — pendiente de configurar en GATE 8
- Panel admin: instalar skill `nextjs` antes de Fase A0