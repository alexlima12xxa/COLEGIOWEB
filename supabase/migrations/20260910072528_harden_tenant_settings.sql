-- Endurecer RLS de tenant_settings: ignorar la cabecera X-Tenant-Id.
-- ---------------------------------------------------------------------------
-- La tabla tenant_settings guarda el deploy hook de Vercel (secreto
-- operativo). Sus políticas usaban public.current_tenant_id(), que hace
-- fallback a la cabecera X-Tenant-Id cuando el JWT no trae
-- app_metadata.tenant_id. Esa cabecera es 100% controlada por el cliente,
-- por lo que un admin auténtico (role = 'admin') podría, en ausencia del
-- claim, resolver otra tenant y leer/escribir el hook de otro colegio.
--
-- Contrato de las funciones RLS (definidas en 20260828000000_init.sql):
--   - public.is_admin()                → (jwt.app_metadata.role) = 'admin'
--   - public.current_tenant_id()       → JWT app_metadata.tenant_id, con
--                                         fallback a X-Tenant-Id. SOLO apta
--                                         para lectura pública de contenido.
--   - public.current_tenant_from_jwt() → SOLO JWT app_metadata.tenant_id,
--                                         sin fallback a cabecera. Para datos
--                                         sensibles (tenant_settings).
--
-- Los JWT del panel siempre llevan app_metadata.tenant_id (lo fija el script
-- de alta colegio-alta.mjs). La función siguiente deja de depender de ese
-- supuesto para el secreto: si el claim no está presente, devuelve NULL y la
-- política deniega (fail-closed en lugar de caer a la cabecera manipulable).

-- Resuelve el tenant SIN fallback a la cabecera X-Tenant-Id.
create or replace function public.current_tenant_from_jwt()
returns uuid
language sql
stable
security invoker
as $$
  select nullif(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')::uuid;
$$;

comment on function public.current_tenant_from_jwt() is
  'Tenant del JWT (app_metadata.tenant_id), sin fallback a la cabecera X-Tenant-Id. Para autorizar datos sensibles (tenant_settings).';

-- Reemplazar las políticas para usar la resolución estricta por JWT.
drop policy "tenant_settings_select_admin" on public.tenant_settings;
drop policy "tenant_settings_update_admin" on public.tenant_settings;

create policy "tenant_settings_select_admin" on public.tenant_settings
  for select to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_from_jwt());

create policy "tenant_settings_update_admin" on public.tenant_settings
  for update to authenticated
  using (public.is_admin() and tenant_id = public.current_tenant_from_jwt())
  with check (public.is_admin() and tenant_id = public.current_tenant_from_jwt());