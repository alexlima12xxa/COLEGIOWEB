# Webhook de rebuild (Supabase → Vercel)

La web pública es **SSG**: el contenido se lee de Supabase solo durante el
build. Cuando el equipo editorial publica o edita contenido en la BD, hay que
re-construir el sitio para que los cambios aparezcan.

```
Supabase (Database Webhook)
   │  INSERT / UPDATE / DELETE en noticias / circulares
   ▼
Edge Function rebuild-webhook   (supabase/functions/rebuild-webhook)
   │  POST (con cabecera x-webhook-token)
   ▼
Vercel Deploy Hook
   │
   ▼
Build SSG completo (< 2 min) → la web queda actualizada
```

## 1. Crear el Deploy Hook en Vercel

1. Abre el proyecto en [vercel.com](https://vercel.com).
2. **Settings → Git → Deploy Hooks**.
3. Crea un hook llamado `supabase-rebuild` (rama de producción, p. ej. `main`).
4. Copia la URL resultante (formato `https://api.vercel.com/v1/integrations/deploy/...`).

## 2. Desplegar la Edge Function

```sh
# Desde la raíz del proyecto (requiere Supabase CLI y login)
supabase functions deploy rebuild-webhook

# Configurar secretos (el hook URL NO debe quedar en el repo)
supabase secrets set \
  VERCEL_DEPLOY_HOOK_URL="https://api.vercel.com/v1/integrations/deploy/..." \
  WEBHOOK_TOKEN="token-aleatorio-largo"
```

`WEBHOOK_TOKEN` es opcional pero recomendado: evita que cualquiera dispare
rebuilds. El token solo viaja entre Supabase y la función (cabecera
`x-webhook-token`).

## 3. Configurar el Database Webhook en Supabase

1. **Dashboard → Database → Webhooks → Create a new webhook** (o "Supabase
   Webhooks" según la versión del dashboard).
2. Tabla: `noticias` (repite el proceso para `circulares`).
3. Eventos: `INSERT`, `UPDATE`, `DELETE`.
4. Destino: HTTP request → URL de la función:
   `https://<project-ref>.supabase.co/functions/v1/rebuild-webhook`
   Método: `POST`.
5. Cabeceras personalizadas: `x-webhook-token: <WEBHOOK_TOKEN>`.

## 4. Probar

Inserta una fila en `noticias` desde el dashboard SQL o el editor de tablas:

```sql
insert into public.noticias (tenant_id, slug, titulo, contenido, publicado)
values (
  (select id from public.colegios where slug = '<slug-del-colegio>'),
  'prueba-rebuild',
  'Prueba de rebuild',
  'Contenido de prueba.',
  true
);
```

En Vercel debe aparecer un deployment nuevo en segundos y, al terminar, la
noticia debe estar visible en `/noticias`.

## Alternativa sin Edge Function

Supabase también permite apuntar el webhook directamente a la URL del deploy
hook de Vercel. La Edge Function es preferible porque permite:

- **Validar el origen** con `x-webhook-token` (los deploy hooks de Vercel no
  tienen autenticación).
- **Centralizar la lógica** si más adelante se quieren rebuilds selectivos o
  un debounce.
- **Ocultar** la URL del deploy hook (se guarda como secreto de la función,
  no en el dashboard).

## Dependencias

- `SUPABASE_SERVICE_ROLE_KEY` y `PUBLIC_TENANT_ID` en el entorno del build
  (Vercel): ver `.env.example` y `README.md`.
