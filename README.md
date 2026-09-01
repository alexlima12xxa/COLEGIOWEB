# WEB-MODELO-1 — Web institucional multi-tenant (Astro SSG + Supabase)

Web pública SSG para colegios (white-label vía `src/site.config.ts`). Una
instancia por colegio; una BD Supabase compartida con `tenant_id` + RLS.

## Requisitos

- Node.js ≥ 22 y pnpm.

## Comandos

| Comando        | Acción                                     |
| -------------- | ------------------------------------------ |
| `pnpm install` | Instala dependencias                       |
| `pnpm dev`     | Servidor de desarrollo en `localhost:4321` |
| `pnpm build`   | Build de producción en `./dist/`           |
| `pnpm check`   | `astro check` + ESLint + Prettier          |
| `pnpm preview` | Previsualiza el build                      |

## Variables de entorno (GATE 4)

Ver `.env.example`. Las tres variables deben existir para leer contenido real
de Supabase:

| Variable                    | Uso                                                    |
| --------------------------- | ------------------------------------------------------ |
| `PUBLIC_SUPABASE_URL`       | URL del proyecto Supabase                              |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo build-time, nunca al navegador) |
| `PUBLIC_TENANT_ID`          | UUID del colegio en la tabla `colegios`                |

**Sin variables configuradas**, el sitio se construye igual usando los
fallbacks versionados de `src/data/fallback/` (`noticias.json`,
`circulares.json`, ...), que comparten el mismo contrato de tipos (zod en
`src/shared/db/schema.ts`) que las tablas.

> **Seguridad**: `.env.example` contiene SOLO placeholders. El repo es
> público; si una clave real se commitea, Supabase la revoca automáticamente.
> Guarda los valores reales solo en `.env` (gitignored) y en las env vars de
> Vercel.

### Rotar claves comprometidas

Si una key se filtró (p. ej. en git), la web seguirá con fallback hasta que se
roten las claves:

1. **Supabase** → **Settings → API** → rotar el JWT secret (regenera anon y
   service role key). Opcionalmente crea una key nueva y elimina la filtrada.
2. **Vercel** → **Project → Settings → Environment Variables**: actualizar
   `PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
3. **Local**: actualizar los mismos valores en `.env`.
4. **Redeploy** y verificar en los logs de build que no aparece el warning
   `[db] ... Usando fallback local`.

## Contenido editorial (noticias y circulares)

- `/noticias` — listado paginado (9 por página; `/noticias/pagina/2`, ...).
- `/noticias/[slug]` — detalle (generado en build con `getStaticPaths`).
- `/circulares` — tabla en desktop, tarjetas en móvil.

Las imágenes de Supabase Storage se descargan en build-time y pasan por
`astro:assets` (`Picture` → AVIF/WebP). Ver `astro.config.ts` →
`image.remotePatterns`.

## Webhook de rebuild

Al publicar contenido en Supabase la web debe reconstruirse. El puente
documentado (Edge Function → Vercel Deploy Hook) está en
[`supabase/functions/README.md`](supabase/functions/README.md).

## Esquema de BD

Migraciones en `supabase/migrations/` (multi-tenant + RLS: lectura por tenant,
escritura por admin). Aplicar con Supabase CLI:

```sh
supabase db push --db-url "$SUPABASE_DB_URL"
```

## Estructura

- `src/shared/db/` — cliente server-side, zod compartido, repositorios
- `src/data/fallback/` — datos de respaldo versionados (mismo contrato que BD)
- `src/features/noticias/` y `src/features/circulares/` — componentes por feature
- `supabase/functions/rebuild-webhook/` — Edge Function de rebuild
