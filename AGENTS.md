## Development

Monorepo pnpm (workspaces). Usa filtros para cada app:

```
pnpm --filter @web-modelo/web dev      # web pública (Astro, background)
pnpm --filter @web-modelo/admin dev    # panel admin (Next.js)
pnpm --filter @web-modelo/aula dev     # aula virtual (Next.js)
```

Para la web (Astro), el dev server usa background mode:
`pnpm --filter @web-modelo/web dev --background` (gestionar con `astro dev stop`, `astro dev status`, `astro dev logs`).

Build de validación:

```
pnpm --filter @web-modelo/web check
pnpm --filter @web-modelo/web build
pnpm --filter @web-modelo/admin build
pnpm --filter @web-modelo/aula build
```

Imágenes locales de marca (`public/branding/`, no las procesa astro:assets):

```
pnpm --filter @web-modelo/web optimize:images   # recomprime placeholders (sharp) in-place
pnpm --filter @web-modelo/web optimize:svg      # optimiza SVGs con SVGO in-place
pnpm --filter @web-modelo/web check:budget      # presupuesto above-fold (post-build; BUDGET_KB=500)
```

> `check` incluye `check:budget`; si no existe `dist/`, el presupuesto se omite.

Modelo multi-colegio (onboarding de un colegio nuevo):

```
pnpm colegio:alta <slug>   # alta automatizada (Supabase + Vercel), ver docs/multi-colegio.md
```

Supabase CLI (esquema y edge functions):

```
npx supabase login                     # iniciar sesión
npx supabase link --project-ref <ref>  # vincular el proyecto
npx supabase db push                   # aplicar migrations de supabase/migrations/
npx supabase secrets set KEY=value     # secrets de edge functions
npx supabase functions deploy rebuild-webhook   # desplegar edge function
```

## Skills de agentes (panel admin)

- `nextjs-app-router-patterns` → arquitectura App Router (server components, routing, layout)
- `nextjs-supabase-auth` → login con Supabase Auth + RLS (sesión del director)
- `supabase` → CRUD, storage, RLS
- Catálogo completo y asignación por fase: ver `.agents/skills/resumen.md`

## Documentation

- Astro: https://docs.astro.build
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs