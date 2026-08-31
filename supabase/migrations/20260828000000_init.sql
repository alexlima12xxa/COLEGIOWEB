-- GATE 4: esquema multi-tenant + RLS
-- ---------------------------------------------------------------------------
-- Una BD compartida entre colegios. Toda tabla de contenido lleva tenant_id
-- (uuid → colegios.id) y RLS habilitado.
--
-- Lectura pública: SOLO en build-time con la service role key (la web es SSG).
-- RLS "lectura por tenant": para llamadas a la Data API con JWT del panel
-- (app_metadata.tenant_id) o con la cabecera X-Tenant-Id.
-- Escritura: solo usuarios con app_metadata.role = 'admin' de su tenant.

-- ── Helpers de tenancy ──────────────────────────────────────────────────────

-- Resuelve el tenant actual:
--   1) claim app_metadata.tenant_id del JWT (lo fija Supabase, no es editable
--      por el usuario final; NO usar raw_user_meta_data para autorización).
--   2) cabecera X-Tenant-Id (patrón SaaS: lectura pública por tenant).
create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security invoker
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid,
    nullif(current_setting('request.headers', true)::jsonb ->> 'x-tenant-id', '')::uuid
  );
$$;

-- ¿El usuario autenticado es admin de su tenant?
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
as $$
  select (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$;

-- ── Tabla colegios (tenants) ────────────────────────────────────────────────

create table public.colegios (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nombre text not null,
  slogan text,
  descripcion text,
  contacto jsonb not null default '{}'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.colegios is 'Colegios (tenants) del esquema multi-tenant.';
comment on column public.colegios.slug is 'Identificador público del colegio (ej. colegio-piloto).';

-- ── Tabla noticias ──────────────────────────────────────────────────────────

create table public.noticias (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.colegios (id) on delete cascade,
  slug text not null,
  titulo text not null,
  resumen text,
  contenido text not null,
  imagen_path text,
  imagen_alt text not null default '',
  autor text,
  publicado boolean not null default true,
  publicado_en timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

comment on column public.noticias.imagen_path is 'Ruta relativa al bucket de Storage "media" (ej. noticias/portada.jpg).';

create index noticias_tenant_publicado_idx
  on public.noticias (tenant_id, publicado, publicado_en desc);

-- ── Tabla circulares ────────────────────────────────────────────────────────

create table public.circulares (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.colegios (id) on delete cascade,
  titulo text not null,
  descripcion text,
  categoria text,
  fecha date not null default current_date,
  archivo_path text,
  archivo_nombre text,
  publicado boolean not null default true,
  publicado_en timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.circulares.archivo_path is 'Ruta relativa al bucket de Storage "media" (ej. circulares/circular-001.pdf).';

create index circulares_tenant_publicado_idx
  on public.circulares (tenant_id, publicado, fecha desc);

-- ── Tabla leads ─────────────────────────────────────────────────────────────

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.colegios (id) on delete cascade,
  nombre text not null,
  email text not null,
  telefono text,
  nivel_interes text,
  mensaje text,
  origen text not null default 'web',
  estado text not null default 'nuevo',
  created_at timestamptz not null default now()
);

create index leads_tenant_created_idx
  on public.leads (tenant_id, created_at desc);

-- ── Trigger updated_at ──────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger colegios_set_updated_at
  before update on public.colegios
  for each row execute function public.set_updated_at();

create trigger noticias_set_updated_at
  before update on public.noticias
  for each row execute function public.set_updated_at();

create trigger circulares_set_updated_at
  before update on public.circulares
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.colegios enable row level security;
alter table public.noticias enable row level security;
alter table public.circulares enable row level security;
alter table public.leads enable row level security;

-- colegios: lectura por tenant (todos) / escritura admin
create policy "colegios_select_tenant" on public.colegios
  for select to anon, authenticated
  using (id = public.current_tenant_id() or public.is_admin());

create policy "colegios_insert_admin" on public.colegios
  for insert to authenticated
  with check (public.is_admin());

create policy "colegios_update_admin" on public.colegios
  for update to authenticated
  using (public.is_admin() and id = public.current_tenant_id())
  with check (public.is_admin() and id = public.current_tenant_id());

create policy "colegios_delete_admin" on public.colegios
  for delete to authenticated
  using (public.is_admin() and id = public.current_tenant_id());

-- noticias: lectura por tenant / escritura admin del tenant
create policy "noticias_select_tenant" on public.noticias
  for select to anon, authenticated
  using (tenant_id = public.current_tenant_id() or public.is_admin());

create policy "noticias_insert_admin" on public.noticias
  for insert to authenticated
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "noticias_update_admin" on public.noticias
  for update to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "noticias_delete_admin" on public.noticias
  for delete to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id());

-- circulares: lectura por tenant / escritura admin del tenant
create policy "circulares_select_tenant" on public.circulares
  for select to anon, authenticated
  using (tenant_id = public.current_tenant_id() or public.is_admin());

create policy "circulares_insert_admin" on public.circulares
  for insert to authenticated
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "circulares_update_admin" on public.circulares
  for update to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "circulares_delete_admin" on public.circulares
  for delete to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id());

-- leads: inserción anónima desde el formulario público + gestión por admin.
-- Nota: el tenant_id de un lead no es secreto (es el mismo PUBLIC_TENANT_ID
-- del build); la política solo exige que el tenant exista y esté activo.
create policy "leads_insert_anon" on public.leads
  for insert to anon
  with check (
    exists (
      select 1 from public.colegios c
      where c.id = tenant_id and c.activo
    )
  );

create policy "leads_insert_admin" on public.leads
  for insert to authenticated
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "leads_select_admin" on public.leads
  for select to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "leads_update_admin" on public.leads
  for update to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "leads_delete_admin" on public.leads
  for delete to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id());

-- ── Grants (exposición a la Data API) ───────────────────────────────────────
-- RLS sigue controlando qué filas se ven; estos grants solo exponen las tablas.

grant select on table public.colegios, public.noticias, public.circulares to anon, authenticated;
-- Leads: INSERT-only para anon (formulario público). Nunca SELECT/UPDATE/DELETE.
grant insert on table public.leads to anon;
grant insert, select, update, delete on table public.leads to authenticated;
grant insert, update, delete on table public.colegios, public.noticias, public.circulares to authenticated;

-- ── Storage: bucket "media" ─────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']
)
on conflict (id) do nothing;

create policy "media_read_public" on storage.objects
  for select
  using (bucket_id = 'media');

create policy "media_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "media_update_admin" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "media_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());