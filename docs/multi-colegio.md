# Modelo multi-colegio — Guía de operación

> Cómo dar de alta un colegio nuevo en el modelo white-label escalable.
> Actualizado: 2026-09-02
>
> **Contrato de contenido/datos**: el detalle de claves, shapes y fallbacks
> entre el panel y la web vive en [`contrato-contenido.md`](./contrato-contenido.md).

## Arquitectura

```
1 repo ── 1 Supabase (N tenants) ── 1 panel admin (todos los directores)
                │
        ┌───────┼───────────┬───────────┐
     web c1   web c2   ...  web cN      (N proyectos Vercel, N dominios)
```

- **Marca** (colores, logo, identidad, SEO) → código: `apps/web/src/configs/<slug>.ts` + `public/branding/<slug>/`. La agencia controla la marca; el director edita solo contenido vía panel.
- **Contenido** → Supabase por `tenant_id` (tablas `noticias`, `circulares`, `contenido`, `leads` + RLS).
- **Rebuild** → deploy hook de Vercel por tenant (`tenant_settings.rebuild_hook_url`), disparado por el panel admin tras cada guardado.
- **Alta de colegio** → `scripts/colegio-alta.mjs` (automatizado).

## Checklist por colegio nuevo

### 1. Marca en código (la agencia)

1. Crear `apps/web/src/configs/<slug>.ts` — copia la forma de `colegio-piloto.ts` con los datos del colegio (identity, contact, social, levels, sections, admissions, branding, seo, supabase). **Sin schema y sin imports desde `site.config.ts`** (dependencia circular).
   > `seo.siteUrl` debe ser `https://` + el mismo `domain` declarado en `clients.json` (paso 2). `validateConfig.ts` rompe el build de producción si no coinciden (misma URL, ignorando el prefijo `www.`). En previews de Vercel (`VERCEL_ENV === "preview"`) no se bloquea.
2. Crear los assets en `public/branding/<slug>/` (logo, logo-inverse, favicon, og-image, placeholders). `validateConfig.ts` falla el build si un asset referenciado no existe.
3. Validar localmente con el slug del colegio:
   ```bash
   $env:PUBLIC_SITE_SLUG="<slug>"; pnpm --filter @web-modelo/web check
   $env:PUBLIC_SITE_SLUG="<slug>"; pnpm --filter @web-modelo/web build
   ```
   > Un colegio con colores que fallan contraste (WCAG ≥ 4.5:1) rompe **solo su build** — es el comportamiento deseado.

### 2. Catálogo

Agregar la entrada en `clients.json` (raíz):

```json
{
  "slug": "colegio-1",
  "domain": "colegio1.com",
  "tenantId": "",
  "adminEmail": "director@colegio1.com",
  "rebuildHookUrl": ""
}
```

> El `domain` debe coincidir con `seo.siteUrl` de `src/configs/<slug>.ts`
> (sin `https://`, ignorando `www.`); `validateConfig.ts` valida la consistencia
> en build-time.

### 3. Alta automatizada

Instalar dependencias raíz (primera vez) y ejecutar:

```bash
pnpm install
pnpm colegio:alta <slug>
```

Env vars requeridas por el script:

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo build-time / scripts) |
| `SUPABASE_ANON_KEY` | Anon key pública |
| `VERCEL_TOKEN` | Token de Vercel (cuenta/team) — salvo `--skip-vercel` |
| `VERCEL_TEAM_ID` | (opcional) Team de Vercel |

Flags útiles: `--password <pw>`, `--domain <d>`, `--email <e>`, `--rebuild-hook <url>`, `--project-name <n>`, `--skip-vercel`, `--skip-seed`.

El script:
1. Upsert del colegio en `colegios` (por slug) → `tenant_id`.
2. Crea el admin en Supabase Auth con `app_metadata { role: "admin", tenant_id }`.
3. Siembra las 12 claves de contenido (plantilla parametrizada).
4. Crea el proyecto Vercel `web-<slug>` (rootDirectory `apps/web`, framework astro), setea env vars (`PUBLIC_TENANT_ID`, `PUBLIC_SITE_SLUG`, Supabase URL/keys), agrega el dominio y crea el deploy hook.
5. Guarda `tenant_settings.rebuild_hook_url`.

> **Regla de negocio (1 email = 1 colegio):** un `adminEmail` pertenece a un único
> colegio. Si el email ya existe en Auth con un `app_metadata.tenant_id` distinto,
> el script **aborta** con error (no sobrescribe) para evitar acceso cruzado entre
> colegios. El re-run del mismo `slug` es idempotente (mismo `tenant_id`), así que
> repetir el alta de un colegio ya dado de alta es seguro.

> **Nota:** el script usa la REST API de Vercel (token), no la CLI interactiva.

### 4. Ignored Build Step (por proyecto)

Cada push al repo dispara builds en **todos** los proyectos Vercel. Para que un push solo reconstruya los colegios afectados, configura en cada proyecto web:

**Vercel → Project → Settings → Git → Ignored Build Step:**

```bash
# Reconstruye solo si cambió la config o assets de ESTE colegio
git diff --quiet HEAD^ HEAD -- apps/web/src/configs/<slug>.ts apps/web/public/branding/<slug>/ && echo "skip"
```

> El comando debe **salir con código 0** para ignorar el build (Vercel ignora si el output es "skip" o el exit code es 0). Ajusta según la convención de tu team.

### 5. Dominio

1. El script agrega el dominio al proyecto Vercel (`vercel domains add` equivalente vía API).
2. En el registrar (Cloudflare), apunta el dominio a Vercel:
   - **Dominio raíz** (`colegio1.com`): registro `A` → `76.76.21.21` (o CNAME a `cname.vercel-dns.com`).
   - **Subdominio** (`www.colegio1.com`): CNAME → `cname.vercel-dns.com`.
3. Vercel emite el certificado SSL automáticamente.

### 6. Rebuild por tenant (webhook)

- El panel admin llama `triggerRebuild(supabase, tenantId)` tras cada guardado → lee `tenant_settings.rebuild_hook_url` → POST al deploy hook de Vercel del colegio.
- Fallback: si no hay registro en `tenant_settings`, usa la env var `REBUILD_HOOK_URL` del proyecto admin (compatibilidad con el flujo original de un solo colegio).
- La tabla `tenant_settings` tiene RLS admin-only: el hook URL **no es legible por anon** (ni siquiera vía `X-Tenant-Id`).

## Seguridad RLS — contrato de funciones de tenancy

Las políticas RLS del esquema dependen de dos helpers definidos en
`20260828000000_init.sql`:

| Función | Definición | Uso |
|---|---|---|
| `public.is_admin()` | `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'` | Autorización de escritura admin |
| `public.current_tenant_id()` | `coalesce(app_metadata.tenant_id, cabecera X-Tenant-Id)` | Lectura pública de contenido por tenant |
| `public.current_tenant_from_jwt()` | Solo `app_metadata.tenant_id` del JWT, **sin fallback a cabecera** | Datos sensibles (`tenant_settings`) |

**Advertencia de seguridad:** `current_tenant_id()` hace *fallback* a la
cabecera `X-Tenant-Id`, que es 100 % controlable por el cliente. Ese fallback
**solo es apto para lectura pública de contenido** (noticias, circulares,
banners, contenido estático). **Nunca** debe usarse para autorizar secretos.

El hook URL de `tenant_settings` (secreto operativo) usa la función estricta
`current_tenant_from_jwt()`, que ignora la cabecera y resuelve el tenant
únicamente desde el JWT firmado. Si el claim no está presente, la política
deniega (fail-closed).

**Invariante:** los JWT del panel admin **siempre** llevan
`app_metadata.tenant_id`, fijado por el script `colegio-alta.mjs` al crear el
usuario (`app_metadata { role: "admin", tenant_id }`) y validado antes de
entrar al panel en `apps/admin/lib/auth.ts` y `apps/admin/proxy.ts`. `role` y
`tenant_id` en `app_metadata` no son editables por el usuario final (los firma
Supabase).

## Limitaciones conocidas

- **`site` en `astro.config.ts`**: ya parametrizado por `siteConfig.seo.siteUrl` (seleccionada por `PUBLIC_SITE_SLUG`). `validateConfig.ts` rompe el build de producción si `seo.siteUrl` no coincide con el `domain` de `clients.json`; los previews de Vercel (`VERCEL_ENV === "preview"`) no se bloquean.
- **Vercel Pro** necesario para >3 proyectos.
- **Costos**: bandwidth/requests por proyecto al crecer (revisar plan Pro/Enterprise).
- **Assets de marca**: el seed referencia `/branding/<slug>/placeholders/...`; si la agencia no los crea, las imágenes 404 en el navegador (no rompen el build). El director puede reemplazarlas desde el panel.
- **Migración de datos**: hoy solo existe el piloto; no hay migración de colegios existentes.

## Fuera de alcance (decisiones)

- Marca editable desde el panel: **NO** — la agencia controla la marca en código.
- Un solo build multi-tenant (Camino 2): solo si el negocio pasa a plataforma.
- Aula virtual: fase posterior del proyecto.