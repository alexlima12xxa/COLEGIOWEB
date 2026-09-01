-- GATE 4 (fix): exponer tablas al rol service_role para el build SSG.
-- ---------------------------------------------------------------------------
-- El build de Vercel lee el contenido editorial con la service role key
-- (src/shared/db/client.ts). Sin GRANT explícito, la Data API responde
-- 42501 permission denied y el sitio se construye con el fallback local
-- (src/data/fallback/), por lo que las noticias reales de Supabase nunca
-- aparecen en el deployment.
--
-- service_role bypasses RLS: solo necesita el GRANT a nivel de tabla para
-- ser alcanzable por PostgREST.

grant usage on schema public to service_role;

grant all on table public.colegios, public.noticias, public.circulares, public.leads to service_role;

-- Future-proof: tablas que se creen en futuras migraciones (bajo postgres)
-- quedan expuestas a service_role automáticamente.
alter default privileges in schema public grant all on tables to service_role;