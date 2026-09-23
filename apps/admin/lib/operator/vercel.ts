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
  ref?: string;
  url: string;
  createdAt?: number;
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
  const repo = process.env.VERCEL_GIT_REPO;
  const provider = process.env.VERCEL_GIT_PROVIDER || "github";

  const body: Record<string, unknown> = {
    name,
    rootDirectory: "apps/web",
    framework: "astro",
  };

  // Conectar el repo EN LA CREACIÓN: sin Git el proyecto no despliega y los
  // deploy hooks devuelven 404 (Vercel exige un repositorio conectado). Ver
  // https://vercel.com/docs/deploy-hooks. Requiere VERCEL_GIT_REPO ("owner/repo").
  if (repo) {
    body.gitRepository = { type: provider, repo };
  }

  return vercelFetch<VercelProject>("/v11/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
// Los deploy hooks viven en `link.deployHooks` del proyecto (no hay un GET de
// hooks); así los lista `vercel deploy-hooks ls`. La creación es
// POST /v2/projects/{id}/deploy-hooks con { name, ref }.
// Requiere que el proyecto esté conectado a Git (si no, 404 / link ausente).

type ProjectWithHooks = { link?: { deployHooks?: VercelHook[] } };

export async function listHooks(projectId: string): Promise<VercelHook[]> {
  const project = await vercelFetch<ProjectWithHooks>(
    `/v9/projects/${projectId}`,
  );
  return project.link?.deployHooks ?? [];
}

export async function getOrCreateDeployHook(
  projectId: string,
  hookName: string,
): Promise<VercelHook> {
  const project = await vercelFetch<ProjectWithHooks>(
    `/v9/projects/${projectId}`,
  );

  if (!project.link) {
    throw new Error(
      "El proyecto Vercel no está conectado a un repositorio Git; no se puede " +
        'crear el deploy hook. Define VERCEL_GIT_REPO (ej. "owner/repo") para ' +
        "que el proyecto se cree con Git, o conéctalo en Vercel → Settings → Git.",
    );
  }

  const existing = (project.link.deployHooks ?? []).find(
    (h) => h.name === hookName,
  );
  if (existing) return existing;

  const ref = process.env.VERCEL_GIT_BRANCH || "main";
  const previousIds = new Set((project.link.deployHooks ?? []).map((h) => h.id));

  const updated = await vercelFetch<ProjectWithHooks>(
    `/v2/projects/${projectId}/deploy-hooks`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: hookName, ref }),
    },
  );

  const created = (updated.link?.deployHooks ?? []).find(
    (h) => !previousIds.has(h.id),
  );
  if (!created) {
    throw new Error("Vercel no devolvió el deploy hook creado.");
  }
  return created;
}

/* ── Estado de dominio (para guía DNS en la UI) ──────────────────────────── */

export async function getDomainConfig(
  domain: string,
): Promise<VercelDomainConfig> {
  return vercelFetch<VercelDomainConfig>(
    `/v9/domains/${encodeURIComponent(domain)}`,
  );
}
