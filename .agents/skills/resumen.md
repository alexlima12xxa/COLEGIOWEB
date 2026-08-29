# Resumen de Skills — WEB-MODELO-1
> Catálogo verificado 2026-08-27. Los agentes deben cruzar cada petición con esta tabla.

## Skills del proyecto (instalados)

| Skill | Ubicación | Fases | Uso principal |
|---|---|---|---|
| `astro` | `~/.opencode/skills/astro` | 0–7 | Arquitectura Astro, tokens CSS, SSG, View Transitions, Content Collections |
| `tailwind-design-system` | `~/.agents/skills/tailwind-design-system` | 1, 2, 3 | Sistema de diseño con Tailwind, tokens, responsive mobile-first |
| `supabase` | `~/.agents/skills/supabase` | 4, 5 | Multi-tenant, RLS, storage, edge functions, webhooks |
| `seo` | `~/.agents/skills/seo` | 1, 4, 7 | JSON-LD, sitemap, Open Graph, structured data |
| `accessibility` | `~/.agents/skills/accessibility` | 2, 3, 7 | WCAG 2.2 AA, focus management, contraste |
| `performance` | `~/.agents/skills/performance` | 3, 7 | Web Vitals, Lighthouse 100/100, optimización de assets |
| `deploy-to-vercel` | `~/.agents/skills/deploy-to-vercel` | 4, 7 | Deploy, deploy hooks (webhook rebuild), env vars |
| `find-skills` | `~/.agents/skills/find-skills` | — | Descubrir/instalar skills futuros |

## Skills de diseño/UI (instalados por el usuario 2026-08-27)
> Estilo del proyecto: institucional, confiable, premium, NO infantil, NO brutalista.
> Los skills de estilo específico son opciones, no defaults.

| Skill | Fases | Uso en proyecto |
|---|---|---|
| `brandkit` | 1 | Identidad de marca (clave para white-label) |
| `design-taste-frontend` | 3, 7 | Criterio estético anti-slop en implementación de páginas |
| `stitch-design-taste` | diseño | Criterio estético para prompts de Google Stitch |
| `gpt-taste` | 3, 7 | Criterio de gusto estético (apoyo) |
| `ui-ux-pro-max` | 2, 3 | Calidad UX/UI en componentes y páginas |
| `high-end-visual-design` | 2, 3 | Estética premium institucional |
| `imagegen-frontend-web` | 3 | Generar assets/placeholders de referencia web |
| `imagegen-frontend-mobile` | 3 | Generar assets/placeholders de referencia móvil |
| `image-to-code` | 3 | Convertir capturas de Stitch a código base |
| `minimalist-ui` | OPCIONAL | Solo si se elige dirección minimalista (no default) |
| `full-output-enforcement` | 7 | Control de output completo del agente |
| `redesign-existing-projects` | — | No aplica a proyecto nuevo (utilidad general) |

## Skills auxiliares (no críticos)
| Skill | Ubicación | Nota |
|---|---|---|
| `vercel-react-best-practices` | `~/.agents/skills/vercel-react-best-practices` | Referencia de rendimiento general (orientado a React) |
| `react` | `~/.opencode/skills/react` | Solo si se usan islas React (no recomendado en este proyecto) |
| `hono-cloudflare` | `~/.opencode/skills/hono-cludfare` | No aplica |

## Brechas conocidas
- **Decap CMS**: no existe skill confiable en el marketplace. Se cubre con `astro` (Content Collections) + documentación oficial de Decap CMS.
- **Playwright/E2E**: no instalado — post-MVP, se decide más adelante.

## Instalación de nuevos skills
```
npx skills find <query>          # buscar
npx skills add <owner/repo@skill> -g -y   # instalar global
```
Verificar con glob en `~/.agents/skills/` y `~/.opencode/skills/`.

## Limpieza de skills (2026-08-27)
- Eliminado: `design-taste-frontend-v1` (duplicado; la canónica es `design-taste-frontend`)
- Eliminado: `industrial-brutalist-ui` (estilo no compatible con colegio institucional)

## Instrucciones por fase (bloques autocontenidos)
Cada fase se ejecuta en un **chat nuevo** pegando el "BLOQUE FX" correspondiente del plan.
- Los agentes nuevos leen este archivo + `.agents/PROJECT.md` como memoria (no necesitan la conversación original).
- Los comandos de terminal (install, build, check, dev, deploy) los ejecuta el **usuario manualmente** para ahorrar tokens.
- Skills a cargar por fase:
  - F0 (config/tooling): `astro`, `tailwind-design-system`
  - F1 (white-label): `astro`, `tailwind-design-system`, `seo`, `brandkit`
  - F2 (layout base): `astro`, `tailwind-design-system`, `accessibility`, `ui-ux-pro-max`
  - F3 (páginas): `astro`, `tailwind-design-system`, `accessibility`, `performance`, `design-taste-frontend`, `ui-ux-pro-max`
  - F4 (Supabase): `astro`, `supabase`, `seo`
  - F5 (leads): `astro`, `supabase`, `accessibility`
  - F6 (Decap CMS): `astro`
  - F7 (optimización): `astro`, `seo`, `performance`, `accessibility`, `tailwind-design-system`, `deploy-to-vercel`, `full-output-enforcement`
  - Diseño Stitch: `stitch-design-taste`, `design-taste-frontend`, `gpt-taste`, `high-end-visual-design`, `brandkit`