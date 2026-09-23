import "server-only";

// Puerto tipado a la API REST de Vercel para la provisión de colegios.
// ---------------------------------------------------------------------------
// SOLO server-side: usa VERCEL_TOKEN (sin prefijo NEXT_PUBLIC_) y nunca llega
// al navegador. Los endpoints siguen los que ya usa scripts/colegio-alta.mjs
// (probados en producción); los métodos de lectura (get/list) usan las rutas
// equivalentes de la API pública.
//
// Idempotencia: los métodos de escritura son create-or-retrieve o "add si no
// está", para que la saga se pueda reanudar sin duplicar recursos.

const VERCEL_API = "https://api.vercel.com";

const ENV_TARGETS = ["production", "preview", "development"] as const;

export class VercelApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, path: string, body: unknown) {
    super(`Vercel API ${status} en ${path}: ${JSON.stringify(body)}`);
    this.name = "VercelApiError";
    this.status = status;
    this.body = body;
  }
}

function vercelHeaders(): Record<string, string> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    throw new Error("Falta VERCEL_TOKEN en el entorno del servidor.");
  }
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (process.env.VERCEL_TEAM_ID) {
    headers["x-vercel-team-id"] = process.env.VERCEL_TEAM_ID;
  }
  return headers;
}

async function vercelFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${VERCEL_API}${path}`, {
    ...options,
    headers: { ...vercelHeaders(), ...(options.headers ?? {}) },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new VercelApiError(res.status, path, body);
  }

  return body as T;
}

/* ── Tipos mínimos (solo los campos que consume la saga) ─────────────────── */

export interface VercelProject {
  id: string;
  name: string;
}

export interface VercelEnv {
  id: string;
  key: string;
  target?: string | string[];
  type?: string;
}

export interface VercelHook {
  id: string;
  name: string;
  url: string;
}

export interface VercelDomainConfig {
  name: string;
  verification?: { domain?: unknown } | null;
  misconfigured?: boolean;
}

/* ── Proyecto ────────────────────────────────────────────────────────────── */

export async function getProject(name: string): Promise<VercelProject | null> {
  try {
    return await vercelFetch<VercelProject>(
      `/v9/projects/${encodeURIComponent(name)}`,
    );
  } catch (error) {
    if (error instanceof VercelApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createProject(name: string): Promise<VercelProject> {
  return vercelFetch<VercelProject>("/v10/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      rootDirectory: "apps/web",
      framework: "astro",
    }),
  });
}

export async function getOrCreateProject(
  name: string,
): Promise<VercelProject> {
  const existing = await getProject(name);
  if (existing) return existing;
  return createProject(name);
}

/* ── Environment variables ───────────────────────────────────────────────── */

export async function listEnv(projectId: string): Promise<VercelEnv[]> {
  const data = await vercelFetch<{ envs: VercelEnv[] }>(
    `/v10/projects/${projectId}/env`,
  );
  return data.envs ?? [];
}

// Create-or-retrieve por key: si ya existe, re-asegura valor y targets con
// PATCH; si no, la crea. El valor de una env `encrypted` no se puede releer,
// así que la idempotencia se basa en la key (no en comparar el valor).
export async function upsertEnv(
  projectId: string,
  key: string,
  value: string,
): Promise<void> {
  const envs = await listEnv(projectId);
  const existing = envs.find((e) => e.key === key);

  if (existing) {
    await vercelFetch(`/v10/projects/${projectId}/env/${existing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, target: ENV_TARGETS }),
    });
    return;
  }

  await vercelFetch(`/v10/projects/${projectId}/env`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value, type: "encrypted", target: ENV_TARGETS }),
  });
}

/* ── Dominios ────────────────────────────────────────────────────────────── */

export async function listDomains(projectId: string): Promise<string[]> {
  const data = await vercelFetch<{ domains: { name: string }[] }>(
    `/v9/projects/${projectId}/domains`,
  );
  return (data.domains ?? []).map((d) => d.name);
}

// Idempotente: no vuelve a agregar un dominio ya vinculado al proyecto.
export async function addDomain(
  projectId: string,
  domain: string,
): Promise<void> {
  const domains = await listDomains(projectId);
  if (domains.includes(domain)) return;

  await vercelFetch(`/v10/projects/${projectId}/domains`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: domain }),
  });
}

/* ── Deploy hooks ────────────────────────────────────────────────────────── */

export async function listHooks(projectId: string): Promise<VercelHook[]> {
  const data = await vercelFetch<{ hooks: VercelHook[] }>(
    `/v10/projects/${projectId}/hooks`,
  );
  return data.hooks ?? [];
}

export async function getOrCreateDeployHook(
  projectId: string,
  hookName: string,
): Promise<VercelHook> {
  const hooks = await listHooks(projectId);
  const existing = hooks.find((h) => h.name === hookName);
  if (existing) return existing;

  return vercelFetch<VercelHook>(`/v10/projects/${projectId}/hooks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: hookName }),
  });
}

/* ── Estado de dominio (para guía DNS en la UI) ──────────────────────────── */

export async function getDomainConfig(
  domain: string,
): Promise<VercelDomainConfig> {
  return vercelFetch<VercelDomainConfig>(
    `/v9/domains/${encodeURIComponent(domain)}`,
  );
}
