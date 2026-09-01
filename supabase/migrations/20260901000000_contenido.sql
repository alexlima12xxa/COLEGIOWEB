-- GATE A1: tabla `contenido` (contenido editorial por tenant).
-- ---------------------------------------------------------------------------
-- Almacena el contenido estructural del sitio como JSONB clave→valor por
-- tenant (colegio). Sigue EXACTAMENTE el patrón de `noticias`: tenant_id con
-- FK a colegios, RLS habilitado, lectura por tenant, escritura solo admin.
--
-- ¿Por qué JSONB? Estas claves no son entidades relacionales (una noticia o
-- un lead sí lo son): son bloques de contenido de la web (mision, hero,
-- niveles, contacto...) cuyo shape cambia con el diseño del front. Un
-- `valor jsonb` permite iterar el sitio sin tocar el esquema; la validación
-- de cada clave vive en el front (zod), igual que con los fallbacks.
--
-- Lectura pública: SOLO en build-time con la service role key (la web es SSG),
-- filtrando por PUBLIC_TENANT_ID. RLS "lectura por tenant" cubre llamadas a la
-- Data API con JWT del panel (app_metadata.tenant_id) o cabecera X-Tenant-Id.
--
-- ── README: claves válidas (task 3) ─────────────────────────────────────────
-- La columna `clave` es un slug libre. Las claves actualmente consumidas por
-- la web del colegio piloto (ver supabase/seed_contenido.sql):
--
--   mision       → jsonb string  Misión institucional (fallback about.mission).
--   vision       → jsonb string  Visión institucional (fallback about.vision).
--   filosofia    → array [{title, description}] pilares pedagógicos
--                  (fallback about.philosophy).
--   historia     → array [{title, date, description}] hitos del colegio
--                  (fallback about.history).
--   hero         → objeto del hero de portada: {badge, name, slogan,
--                  description, heroPhoto, tourPoster, actions[]}
--                  (site.config + fallback home).
--   video_tour   → {videoUrl, poster, title, description} video del tour
--                  virtual (VideoModal de la portada).
--   autoridades  → array [{name, role, image}] directivos (about.authorities).
--   niveles      → objeto con una entrada por nivel educativo: {preescolar,
--                  primaria, secundaria, media-tecnica} (fallback levels).
--   admisiones   → {schedule[], requirements[], faq[]} (fallback admissions).
--   galeria      → array [{src, alt, variant}] galería bento (home.bentoGallery).
--   contacto     → {departments[], formFields[]} (fallback contact).
--
-- Contrato: una clave que se edite en el panel/admin debe mantener el MISMO
-- shape que consume la web (zod). Documentar aquí toda clave nueva.

create table public.contenido (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.colegios (id) on delete cascade,
  clave text not null,
  valor jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, clave)
);

comment on table public.contenido is 'Contenido editorial por tenant (clave → valor JSONB).';
comment on column public.contenido.clave is 'Identificador de la clave de contenido (ver README de claves en este archivo).';
comment on column public.contenido.valor is 'Payload JSONB de la clave (shape validado en el front con zod).';

create index contenido_tenant_clave_idx
  on public.contenido (tenant_id, clave);

create trigger contenido_set_updated_at
  before update on public.contenido
  for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.contenido enable row level security;

-- lectura por tenant (todos) / escritura admin del tenant (mismo patrón noticias)
create policy "contenido_select_tenant" on public.contenido
  for select to anon, authenticated
  using (tenant_id = public.current_tenant_id() or public.is_admin());

create policy "contenido_insert_admin" on public.contenido
  for insert to authenticated
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "contenido_update_admin" on public.contenido
  for update to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "contenido_delete_admin" on public.contenido
  for delete to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id());

-- ── Grants (exposición a la Data API) ───────────────────────────────────────
-- RLS sigue controlando qué filas se ven; estos grants solo exponen la tabla.
-- service_role: lo cubre `alter default privileges` de la migración
-- 20260831000000_grant_service_role.sql; se repite aquí de forma explícita
-- por claridad (bypassa RLS, solo necesita el GRANT).

grant select on table public.contenido to anon, authenticated;
grant insert, update, delete on table public.contenido to authenticated;
grant all on table public.contenido to service_role;