-- Alta de colegios desde /operador: jobs de provisión + auditoría.
-- ---------------------------------------------------------------------------
-- Modelo multi-colegio: el alta de un colegio nuevo deja de hacerse desde un
-- script local (token omnipotente) y pasa a un plano operador del panel admin
-- autorizado por rol `superadmin`, con una saga de provisión idempotente y
-- reanudable (create-or-retrieve por paso).
--
-- ADITIVO: no elimina ni modifica tablas o policies existentes. No toca RLS
-- de tenant ni el aislamiento actual.
--
-- Decisiones de diseño (ver reports/2026-09-21_alta-colegios-operador.md):
--   F1: el rol `superadmin` NO existe en la BD. No se crea is_superadmin() ni
--       policies *_superadmin. La autorización del operador vive en la capa de
--       aplicación (requireSuperadmin) y TODO acceso a datos es service_role
--       server-side. service_role bypassa RLS; solo necesita el GRANT.
--   F2: colegios.domain es copia operativa (unicidad/listado); la fuente de
--       SEO sigue siendo clients.json (la valida la web en build).
--   F4: provisioning_jobs persiste estado + pasos; updated_at actúa como lock
--       del claim atómico. error_code categoriza RECOVERABLE vs FATAL.

-- ── 1. Dominio por colegio (unicidad operativa) ─────────────────────────────

alter table public.colegios
  add column if not exists domain text not null default '';

comment on column public.colegios.domain is
  'Dominio operativo del colegio (hostname, sin protocolo). Copia para unicidad y listado; la fuente de SEO es clients.json.';

-- Índice único PARCIAL: permite múltiples '' (colegios legacy sin dominio) y
-- garantiza que dos colegios no compartan hostname (case-insensitive).
create unique index if not exists colegios_domain_unique_idx
  on public.colegios (lower(domain))
  where domain <> '';

-- ── 2. Job de provisión (estado + pasos persistidos, reanudable) ────────────

create table public.provisioning_jobs (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null,
  domain       text not null default '',
  admin_email  text not null default '',
  nombre       text not null default '',
  tenant_id    uuid references public.colegios (id) on delete set null,
  status       text not null default 'pending'
               check (status in ('pending', 'running', 'failed', 'done')),
  current_step text,
  steps        jsonb not null default '[]'::jsonb,
  error        text,
  error_code   text
               check (error_code is null or error_code in ('RECOVERABLE', 'FATAL')),
  created_by   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.provisioning_jobs is
  'Jobs de provisión de colegios disparados desde /operador. Estado + pasos (steps) para saga idempotente y reanudable.';
comment on column public.provisioning_jobs.steps is
  'Array [{name,status,detail,at}] con el estado de cada paso de la saga. Permite saltar pasos ya hechos y reanudar.';
comment on column public.provisioning_jobs.error_code is
  'RECOVERABLE (transitorio: reintentar) o FATAL (invariante: no reintentar).';
comment on column public.provisioning_jobs.updated_at is
  'También actúa como lock del claim atómico (un worker por vez; stale tras 90s).';

create trigger provisioning_jobs_set_updated_at
  before update on public.provisioning_jobs
  for each row execute function public.set_updated_at();

alter table public.provisioning_jobs enable row level security;

-- El operador NO lee estas tablas por JWT; las lee/escribe el server con
-- service_role. Sin policies para anon/authenticated → fail-closed.
grant all on table public.provisioning_jobs to service_role;

-- ── 3. Auditoría del operador (append-only) ─────────────────────────────────

create table public.operator_actions (
  id          uuid primary key default gen_random_uuid(),
  actor_email text,
  action      text not null,
  payload     jsonb not null default '{}'::jsonb,
  result      text,
  created_at  timestamptz not null default now()
);

comment on table public.operator_actions is
  'Auditoría append-only de acciones del operador (alta de colegios, reintentos, etc.).';

alter table public.operator_actions enable row level security;

grant all on table public.operator_actions to service_role;

-- NOTA EXPLÍCITA: no se crea public.is_superadmin() ni policies *_superadmin
-- sobre colegios. El rol superadmin existe solo en app_metadata del JWT y se
-- valida en la capa de aplicación; el poder real (service_role) es server-only.
