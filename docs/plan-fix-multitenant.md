# Plan de corrección multi-tenant (RLS + env vars + preview)

> Fecha: 2026-09-13. Contexto completo para ejecutar/continuar en cualquier
> sesión sin perder información.

## Diagnóstico

Tres problemas encontrados en el sistema multi-colegio (1 repo, 1 Supabase,
1 panel admin, N proyectos Vercel):

1. **Fuga de tenant en RLS (crítico).** Las 5 políticas de `SELECT` usan
   `... or public.is_admin()`. Como `is_admin()` devuelve `true` para
   cualquier usuario con `role='admin'` (independiente del colegio), el `OR`
   anula el filtro por tenant y **cualquier admin ve las filas de todos los
   colegios**.
2. **`PUBLIC_TENANT_ID` / `PUBLIC_SITE_SLUG` cruzados/ausentes en Vercel.**
   Las webs leen el tenant equivocado (por eso "solo aparece 1 banner" o la
   marca de otro colegio). Faltan env vars en ambos proyectos web.
3. **Preview de banners no multi-tenant.** `NEXT_PUBLIC_WEB_URL` es global en
   el admin y `PREVIEW_SIGNING_KEY` es único. Se resuelve con
   `preview_web_url` por tenant.

## Mapeo de IDs (fijado)

| Colegio | tenant_id | Web | slug |
|---|---|---|---|
| piloto | `7dbbd9d5-f09b-4d0c-9c7c-7c26d7f543e1` | `colegioweb.vercel.app` | `colegio-piloto` |
| nuevo | `170c34f8-108c-4c5a-83e5-0a39ea14d31c` | `colegionuevo.yachay-ia.com` | `colegio-nuevo` |

> El dominio del piloto (`colegioweb.vercel.app`) es provisional; se cambiará
> más adelante (afecta `preview_web_url` en `tenant_settings`).

## Env vars de Supabase (un solo proyecto multi-tenant)

- `PUBLIC_SUPABASE_URL=https://ledfrlawqrbdnummdgrm.supabase.co`
- `PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`: ver `apps/web/.env`
- `PREVIEW_SIGNING_KEY=87IQ28Ewxz0MUhFLoDyezUnZ3yJQuJfqg0RSP/cvY44ycfiAcq3Q1cVkk96VaY3N`
  (único, compartido entre admin y las webs)

## Env vars a configurar en Vercel (manual)

Proyecto `colegioweb` (piloto) y `web-colegio-nuevo`, en production/preview/development:

| Var | piloto | nuevo |
|---|---|---|
| `PUBLIC_SITE_SLUG` | `colegio-piloto` | `colegio-nuevo` |
| `PUBLIC_TENANT_ID` | `7dbbd9d5-f09b-4d0c-9c7c-7c26d7f543e1` | `170c34f8-108c-4c5a-83e5-0a39ea14d31c` |
| `PUBLIC_SUPABASE_URL` | `https://ledfrlawqrbdnummdgrm.supabase.co` | idem |
| `PUBLIC_SUPABASE_ANON_KEY` | de `apps/web/.env` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | de `apps/web/.env` | idem |
| `PREVIEW_SIGNING_KEY` | valor único | idem |

## SQL para poblar preview_web_url (tras migración)

```sql
UPDATE public.tenant_settings SET preview_web_url = 'https://colegioweb.vercel.app'
WHERE tenant_id = '7dbbd9d5-f09b-4d0c-9c7c-7c26d7f543e1';

UPDATE public.tenant_settings SET preview_web_url = 'https://colegionuevo.yachay-ia.com'
WHERE tenant_id = '170c34f8-108c-4c5a-83e5-0a39ea14d31c';
```

## Verificación final

1. `npx supabase db push` (o SQL Editor) aplica RLS + columna.
2. Configurar env vars en Vercel.
3. Redeploy de ambas webs.
4. Verificar: cada admin ve solo sus banners; cada web muestra su tenant/marca;
   el preview del banner apunta a la web del colegio.