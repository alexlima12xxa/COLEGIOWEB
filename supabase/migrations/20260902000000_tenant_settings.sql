-- Modelo multi-colegio: settings por tenant (rebuild hook por colegio)
-- ---------------------------------------------------------------------------
-- Guarda el deploy hook de Vercel de cada colegio para que el panel admin
-- reconstruya SOLO la web del tenant afectado (triggerRebuild).
--
-- Seguridad: el hook URL es un secreto operativo. NO se expone a anon
-- (aunque la cabecera X-Tenant-Id permita resolver el tenant, el hook no
-- debe ser legible por el público). Solo el admin del tenant puede
-- leer/actualizar su propio registro; service_role tiene acceso total.

create table public.tenant_settings (
  tenant_id uuid primary key references public.colegios (id) on delete cascade,
  rebuild_hook_url text not null default ''
);

comment on table public.tenant_settings is 'Settings por tenant (deploy hook de Vercel para rebuild de la web).';
comment on column public.tenant_settings.rebuild_hook_url is 'Deploy hook URL de Vercel del proyecto web del colegio. Secreto operativo: solo admin del tenant y service_role.';

alter table public.tenant_settings enable row level security;

-- select/update: SOLO admin del tenant. Nunca anon, aunque X-Tenant-Id
-- resuelva el tenant — el hook URL no es público.
create policy "tenant_settings_select_admin" on public.tenant_settings
  for select to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id());

create policy "tenant_settings_update_admin" on public.tenant_settings
  for update to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_id())
  with check (public.is_admin() and tenant_id = public.current_tenant_id());

-- Grants: solo authenticated (select/update) y service_role (todo).
-- service_role bypasses RLS: el grant a nivel de tabla lo hace alcanzable
-- por PostgREST para el build SSG y el script de alta de colegios.
grant select, update on table public.tenant_settings to authenticated;
grant all on table public.tenant_settings to service_role;