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

---

# Envío de leads por correo (Supabase → Resend)

Cuando un visitante envía el formulario de admisiones, la web inserta un lead
en `public.leads`. Un Database Webhook dispara la Edge Function
`send-lead-email`, que reenvía los datos por correo al colegio usando Resend.

```
Formulario web
   │  INSERT en public.leads (fire-and-forget, desde el navegador)
   ▼
Supabase (Database Webhook en leads)
   │  POST (con cabecera x-webhook-token)
   ▼
Edge Function send-lead-email
   │  resuelve el correo destino del tenant (clave `notificaciones` o secret)
   │  POST a https://api.resend.com/emails
   ▼
Inbox del colegio (Gmail / correo institucional)
```

## 1. Cuenta y API key de Resend

1. Crea una cuenta en [resend.com](https://resend.com).
2. Crea una API key (Settings → API Keys).
3. En modo prueba NO hace falta verificar dominio: el remitente es
   `onboarding@resend.dev` y solo puede enviar a la dirección con la que te
   registraste. Para probar, el correo destino debe ser tu propio email.

## 2. Desplegar la Edge Function y configurar secretos

```sh
supabase functions deploy send-lead-email

supabase secrets set \
  RESEND_API_KEY="re_..." \
  LEAD_EMAIL_TO="colegio@email.com" \
  WEBHOOK_TOKEN="token-aleatorio-largo" \
  SUPABASE_URL="https://<project-ref>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
```

- `RESEND_API_KEY`: clave de Resend (solo en el servidor, nunca en el cliente).
- `LEAD_EMAIL_TO`: correo destino de respaldo. Se usa cuando el tenant no tiene
  configurado un correo propio en la clave `notificaciones` del panel admin.
- `WEBHOOK_TOKEN`: protege la función contra llamadas no autorizadas.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: permiten a la función leer la
  clave `notificaciones` del tenant para resolver su correo destino.

## 3. Configurar el Database Webhook

1. Dashboard → Database → Webhooks → Create a new webhook.
2. Tabla: `leads`. Evento: `INSERT`.
3. Destino: HTTP request → `https://<project-ref>.supabase.co/functions/v1/send-lead-email`
   Método: `POST`.
4. Cabeceras personalizadas: `x-webhook-token: <WEBHOOK_TOKEN>`.

## 4. Correo destino por colegio (multi-colegio)

El correo destino se resuelve en este orden:

1. Clave `notificaciones` en la tabla `contenido` del tenant (editable desde el
   panel admin, sección Contacto → «Correo de notificaciones de leads»).
2. Secret `LEAD_EMAIL_TO` (respaldo global).

El remitente es `onboarding@resend.dev` (prueba). Cuando un colegio verifique su
propio dominio en la cuenta Resend, se puede mapear un remitente por tenant
(ej. `informes@colegio.edu`).
