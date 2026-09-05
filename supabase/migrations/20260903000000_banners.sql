-- GATE A2: tabla `banners` (hero dinámico por tenant).
-- ---------------------------------------------------------------------------
-- Sistema de banners del hero de portada: permite que el director edite N
-- banners (slider) que reemplazan al hero estático. Sigue el MISMO patrón de
-- tenancy que `noticias` y `contenido`: tenant_id con FK a colegios, RLS
-- habilitado, lectura por tenant, escritura solo admin del tenant.
--
-- ¿Por qué una tabla dedicada (y no una clave de `contenido`)? Los banners son
-- entidades ordenables con ciclo de vida propio (activo, orden, activación),
-- por lo que necesitan SQL relacional y un índice por (tenant_id, activo,
-- orden) para el slider. El payload visual por plantilla vive en `datos jsonb`
-- (mismo criterio que `contenido.valor`): su shape lo valida el front con zod y
-- varía según `plantilla_id`, sin tocar el esquema.
--
-- Columna `plantilla_id` → slug del componente Astro que renderiza el banner
-- (ver apps/web/src/features/home/components/HomeBanner/ y el catálogo en
-- packages/shared/src/banners/). Valores iniciales (se amplía añadiendo una
-- entrada al catálogo + su componente, sin tocar Supabase):
--   "duotono"    → gradiente de dos colores (sin foto)
--   "granulado"  → color sólido + textura de ruido SVG (sin foto)
--   "foto"       → imagen full-bleed de fondo
--
-- `datos jsonb` por plantilla (shape validado en front con zod, con
-- `.passthrough()` para campos propios de cada banner):
--   { background?, image?, title?, subtitle?, tono?, cta?, actions[], ... }
--   - background: ruta del asset de fondo (bucket "media") — solo "foto".
--   - tono: clave del par/tono de color elegido (opciones controladas).
--   - cta/actions[]: {label, href} — los enlaces viven DENTRO del banner.
--
-- Lectura pública: SOLO en build-time con la service role key (web SSG). RLS
-- "lectura por tenant" cubre la Data API con JWT del panel o X-Tenant-Id.

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.colegios (id) on delete cascade,
  plantilla_id text not null,
  orden integer not null default 0,
  activo boolean not null default true,
  datos jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.banners is 'Banners del hero de portada por tenant (slider).';
comment on column public.banners.plantilla_id is 'Slug del componente Astro de plantilla (catálogo en packages/shared: duotono, granulado, foto, ...).';
comment on column public.banners.orden is 'Orden de aparición en el slider (ascendente).';
comment on column public.banners.datos is 'Payload JSONB de la plantilla: textos, colores, assets y acciones. Validado en front con zod.';

create index banners_tenant_orden_idx
  on public.banners (tenant_id, activo, orden);

create trigger banners_set_updated_at
  before update on public.banners
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.banners enable row level security;

-- lectura por tenant (todos) / escritura admin del tenant (mismo patrón noticias)
create policy "banners_select_tenant" on public.banners
  for select to anon, authenticated
  using (tenant_id = public.current_tenant_id() or public.is_admin());

create policy "banners_insert_admin" on public.banners
  for insert to authenticated
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "banners_update_admin" on public.banners
  for update to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "banners_delete_admin" on public.banners
  for delete to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id());

-- ── Grants (exposición a la Data API) ───────────────────────────────────────
-- RLS controla qué filas se ven. service_role bypassa RLS y solo necesita GRANT.

grant select on table public.banners to anon, authenticated;
grant insert, update, delete on table public.banners to authenticated;
grant all on table public.banners to service_role;