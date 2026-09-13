-- Corrige fuga de tenant en SELECT de contenido: elimina `or public.is_admin()`,
-- que permitía a cualquier admin (role = 'admin', de cualquier colegio) leer las
-- filas de TODOS los tenants. Ahora cada fila se filtra estrictamente por el
-- tenant del JWT (o cabecera X-Tenant-Id para lectura pública por tenant).
--
-- La service role NO se ve afectada (bypasa RLS vía grant a service_role),
-- por lo que la web SSG sigue leyendo en build-time sin cambios.
--
-- Además añade la columna `preview_web_url` a tenant_settings para el preview
-- del editor de banners por tenant (misma lógica que rebuild_hook_url).

drop policy if exists "colegios_select_tenant" on public.colegios;
drop policy if exists "noticias_select_tenant" on public.noticias;
drop policy if exists "circulares_select_tenant" on public.circulares;
drop policy if exists "contenido_select_tenant" on public.contenido;
drop policy if exists "banners_select_tenant" on public.banners;

create policy "colegios_select_tenant" on public.colegios
  for select to anon, authenticated
  using (id = public.current_tenant_id());

create policy "noticias_select_tenant" on public.noticias
  for select to anon, authenticated
  using (tenant_id = public.current_tenant_id());

create policy "circulares_select_tenant" on public.circulares
  for select to anon, authenticated
  using (tenant_id = public.current_tenant_id());

create policy "contenido_select_tenant" on public.contenido
  for select to anon, authenticated
  using (tenant_id = public.current_tenant_id());

create policy "banners_select_tenant" on public.banners
  for select to anon, authenticated
  using (tenant_id = public.current_tenant_id());

alter table public.tenant_settings
  add column if not exists preview_web_url text not null default '';

comment on column public.tenant_settings.preview_web_url is
  'URL base de la web del colegio (para el preview del editor de banners). No es secreto: solo se usa para construir la URL del iframe.';