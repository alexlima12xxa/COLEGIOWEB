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
- Web pública: Astro SSG en `tuapp.com` (Vercel)
- Aula virtual (futuro): Next.js en `aula.tuapp.com` (Vercel)
- BD compartida: Supabase (una BD, tablas con `tenant_id` + RLS)
- Sesión entre subdominios: Opción B (login propio en el aula) — decidida para MVP

## Mapa de responsabilidades (estructura objetivo)
- `src/site.config.ts` → fuente de verdad del white-label (validado con zod en build)
- `src/styles/` → sistema de capas CSS (`_tokens.css`, `_reset.css`, `_base.css`, `_layers.css`, `global.css`)
- `src/shared/` → componentes UI reutilizables, layouts, lib, db client
- `src/features/` → componentes específicos por feature (noticias, admisiones, etc.)
- `src/pages/` → rutas públicas (10+ páginas)
- `src/data/fallback/` → JSON versionados (mismo contrato que tablas Supabase)
- `public/branding/` → assets por colegio (logo SVG, fotos, video tour)
- `public/admin/` → configuración Decap CMS
- `supabase/migrations/` → esquema multi-tenant + RLS

## Convenciones detectadas (decididas en planificación)
- Mobile-first estricto (70%+ tráfico móvil)
- Clases BEM en CSS externo; componentes PascalCase; utilidades camelCase
- Prohibido: valores crudos de color/spacing fuera de `_tokens.css`, `!important`, inline styles
- Prohibido: escribir `@media` manual con valores crudos — usar breakpoints nativos de Tailwind v4 (`--breakpoint-*` en `@theme`) y variantes responsive (`md:`, `lg:`). Ver `src/styles/_tokens.css`.
- Prohibido: fetch en cliente para contenido indexable (SSG + webhook rebuild)
- Prohibido: service role key de Supabase en el navegador (solo build-time)
- Formulario de leads: doble vía (persistir en Supabase → abrir WhatsApp)

## Restricciones (decisiones que NO se cuestionan)
- Vercel para ambas apps (web pública + aula virtual)
- Dominio comprado en Cloudflare Registrar
- pnpm como gestor de paquetes
- White-label 100% vía `site.config.ts` + tokens CSS
- Contenido editorial vía Decap CMS (Fase 1) → migración a panel del portal (Fase 2 futura)
- Objetivo: 100/100 Google PageSpeed móvil

## Estado actual
- GATE 0 completado: 20 skills operativos (8 core + 12 diseño/UI), contexto creado
- Fase 0.1 completada: scaffolding Astro 7.2.9 + TS strict + pnpm; dependencias base instaladas (tailwindcss, @tailwindcss/vite, @lucide/astro, @astrojs/vercel); build de prueba OK
- Fase 0.2-0.4 pendiente: configurar astro.config.mjs (Tailwind Vite + adapter Vercel), sistema de capas CSS, estructura feature-based, ESLint/Prettier/CI
- Skills de diseño/UI integrados y clasificados en `.agents/skills/resumen.md` (brandkit, design-taste-frontend, ui-ux-pro-max, high-end-visual-design, stitch-design-taste, gpt-taste, imagegen-web/mobile, image-to-code, minimalist-ui, full-output-enforcement). Eliminados: design-taste-frontend-v1 (duplicado) e industrial-brutalist-ui (no aplica).
- Instrucciones por fase (bloques autocontenidos para chat nuevo) documentadas en `.agents/skills/resumen.md`

## Decisiones clave
- SSG + fetch en build-time (no SSR, no fetch en cliente) para noticias/circulares
- Webhook Supabase → deploy hook de Vercel para rebuild (< 2 min)
- Multi-tenancy: una BD compartida con `tenant_id` + RLS en todas las tablas
- Validación de contraste WCAG ≥ 4.5:1 en build (falla si no cumple)
- Decap CMS sobre Supabase como CMS en Fase 1 (contrato de datos compartido)

## Ambigüedades pendientes
- Nombre real del dominio (`tuapp.com` es placeholder)
- Datos reales del colegio piloto (nombre, colores, niveles, contacto)
- Cuenta de GitHub para Decap CMS (Git Gateway)