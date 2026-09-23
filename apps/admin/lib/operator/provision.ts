import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase-admin";
import { findUserByEmail } from "./preflight";
import {
  addDomain,
  getOrCreateDeployHook,
  getOrCreateProject,
  upsertEnv,
} from "./vercel";
import { buildSeed, CONTENT_KEYS, humanize } from "./seed";

// Saga idempotente y reanudable de provisión de un colegio.
// ---------------------------------------------------------------------------
// Cada paso es create-or-retrieve y persiste su estado en provisioning_jobs.
// `runProvisioning(jobId)` puede llamarse muchas veces (waitUntil inicial,
// polling de la UI, botón Reintentar): un claim atómico garantiza un solo
// worker por vez; los pasos ya `done` se saltan. Si un serverless se corta, el
// polling detecta inactividad y vuelve a claimar (stale lock).
// Ver reports/2026-09-21_alta-colegios-operador.md (F4).

const STALE_SECONDS = 90;

export type StepStatus = "pending" | "running" | "done" | "failed";

export interface StepRecord {
  name: string;
  status: StepStatus;
  detail?: unknown;
  at?: string;
}

interface ProvisioningJobRow {
  id: string;
  slug: string;
  domain: string;
  admin_email: string;
  nombre: string;
  tenant_id: string | null;
  status: string;
  current_step: string | null;
  steps: StepRecord[] | null;
  error: string | null;
  error_code: string | null;
  created_by: string | null;
}

interface ProvisionContext {
  admin: SupabaseClient;
  jobId: string;
  slug: string;
  domain: string;
  adminEmail: string;
  nombre: string;
  tenantId: string | null;
  projectId?: string;
  deployHookUrl?: string;
  steps: StepRecord[];
}

// Error de saga con código de reintento. FATAL = invariante (no reintentar);
// RECOVERABLE = transitorio (reintentar).
class ProvisionError extends Error {
  readonly code: "RECOVERABLE" | "FATAL";

  constructor(code: "RECOVERABLE" | "FATAL", message: string) {
    super(message);
    this.name = "ProvisionError";
    this.code = code;
  }
}

function isoNow(): string {
  return new Date().toISOString();
}

function markStep(
  steps: StepRecord[],
  name: string,
  patch: Partial<StepRecord>,
): StepRecord[] {
  const idx = steps.findIndex((s) => s.name === name);
  if (idx === -1) {
    return [...steps, { name, status: "pending", ...patch, at: isoNow() }];
  }
  const next = steps.slice();
  next[idx] = { ...next[idx], ...patch, at: isoNow() };
  return next;
}

async function persistSteps(
  ctx: ProvisionContext,
  currentStep: string,
): Promise<void> {
  const { error } = await ctx.admin
    .from("provisioning_jobs")
    .update({ steps: ctx.steps, current_step: currentStep })
    .eq("id", ctx.jobId);
  if (error) throw error;
}

// Claim atómico: solo un worker ejecuta a la vez. Devuelve el job si lo ganó,
// o null si otro worker está activo o el job ya terminó.
async function claimJob(
  admin: SupabaseClient,
  jobId: string,
): Promise<ProvisioningJobRow | null> {
  // 1) pending / failed → claim directo.
  const { data, error } = await admin
    .from("provisioning_jobs")
    .update({ status: "running" })
    .eq("id", jobId)
    .in("status", ["pending", "failed"])
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (data) return data as ProvisioningJobRow;

  // 2) running pero stale (worker muerto por timeout) → re-claim.
  const staleCutoff = new Date(Date.now() - STALE_SECONDS * 1000).toISOString();
  const { data: staleData, error: staleError } = await admin
    .from("provisioning_jobs")
    .update({ status: "running" })
    .eq("id", jobId)
    .eq("status", "running")
    .lt("updated_at", staleCutoff)
    .select("*")
    .maybeSingle();

  if (staleError) throw staleError;
  return staleData as ProvisioningJobRow | null;
}

async function ensureProjectId(ctx: ProvisionContext): Promise<string> {
  if (!ctx.projectId) {
    const project = await getOrCreateProject(`web-${ctx.slug}`);
    ctx.projectId = project.id;
  }
  return ctx.projectId;
}

async function ensureDeployHookUrl(ctx: ProvisionContext): Promise<string> {
  if (!ctx.deployHookUrl) {
    const projectId = await ensureProjectId(ctx);
    const hook = await getOrCreateDeployHook(projectId, "rebuild-webhook");
    ctx.deployHookUrl = hook.url;
  }
  return ctx.deployHookUrl;
}

/* ── Pasos de la saga ────────────────────────────────────────────────────── */

async function stepColegio(ctx: ProvisionContext): Promise<unknown> {
  const { data, error } = await ctx.admin
    .from("colegios")
    .upsert({ slug: ctx.slug, nombre: ctx.nombre, activo: false }, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) throw error;

  ctx.tenantId = data.id;
  const { error: linkError } = await ctx.admin
    .from("provisioning_jobs")
    .update({ tenant_id: data.id })
    .eq("id", ctx.jobId);
  if (linkError) throw linkError;

  return { tenantId: data.id };
}

async function stepAdminUser(ctx: ProvisionContext): Promise<unknown> {
  if (!ctx.tenantId) throw new ProvisionError("FATAL", "Falta tenant_id del colegio.");

  const existing = await findUserByEmail(ctx.admin, ctx.adminEmail);

  if (!existing) {
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? "https://admin.yachay-ia.com"
    ).replace(/\/$/, "");
    const { data, error } = await ctx.admin.auth.admin.inviteUserByEmail(
      ctx.adminEmail,
      { redirectTo: `${appUrl}/auth/confirm` },
    );
    if (error) throw error;

    const { error: updateError } = await ctx.admin.auth.admin.updateUserById(
      data.user.id,
      { app_metadata: { role: "admin", tenant_id: ctx.tenantId } },
    );
    if (updateError) throw updateError;

    return { invited: true, userId: data.user.id };
  }

  const prevTenant = existing.app_metadata?.tenant_id;
  if (prevTenant && prevTenant !== ctx.tenantId) {
    throw new ProvisionError(
      "FATAL",
      `El email ${ctx.adminEmail} ya es admin de otro colegio (1 email = 1 colegio).`,
    );
  }

  const { error: updateError } = await ctx.admin.auth.admin.updateUserById(
    existing.id,
    { app_metadata: { role: "admin", tenant_id: ctx.tenantId } },
  );
  if (updateError) throw updateError;

  return { invited: false, userId: existing.id };
}

async function stepSeed(ctx: ProvisionContext): Promise<unknown> {
  if (!ctx.tenantId) throw new ProvisionError("FATAL", "Falta tenant_id del colegio.");

  const seed = buildSeed({
    slug: ctx.slug,
    nombre: ctx.nombre,
    adminEmail: ctx.adminEmail,
  });

  for (const clave of CONTENT_KEYS) {
    const { error } = await ctx.admin.from("contenido").upsert(
      { tenant_id: ctx.tenantId, clave, valor: seed[clave] },
      { onConflict: "tenant_id,clave" },
    );
    if (error) throw error;
  }

  return { keys: CONTENT_KEYS.length };
}

async function stepVercelProject(ctx: ProvisionContext): Promise<unknown> {
  const project = await getOrCreateProject(`web-${ctx.slug}`);
  ctx.projectId = project.id;
  return { projectId: project.id, name: project.name };
}

// Origen del panel admin (para el CSP frame-ancestors del preview en la web).
function adminOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

async function stepVercelEnv(ctx: ProvisionContext): Promise<unknown> {
  const projectId = await ensureProjectId(ctx);
  if (!ctx.tenantId) throw new ProvisionError("FATAL", "Falta tenant_id del colegio.");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new ProvisionError(
      "FATAL",
      "Faltan env vars de Supabase en el servidor del admin.",
    );
  }

  // Config (legible) para lo público; Secret para la service key y la firma del
  // preview de banners. Ver reports/2026-09-21_alta-colegios-operador.md.
  const vars: { key: string; value: string; type: "encrypted" | "sensitive" }[] = [
    { key: "PUBLIC_TENANT_ID", value: ctx.tenantId, type: "encrypted" },
    { key: "PUBLIC_SITE_SLUG", value: ctx.slug, type: "encrypted" },
    { key: "PUBLIC_SUPABASE_URL", value: supabaseUrl, type: "encrypted" },
    { key: "PUBLIC_SUPABASE_ANON_KEY", value: anonKey, type: "encrypted" },
    { key: "SUPABASE_SERVICE_ROLE_KEY", value: serviceKey, type: "sensitive" },
  ];

  const warnings: string[] = [];

  // Debe ser idéntica a la del admin para que la web valide el token de preview.
  const previewKey = process.env.PREVIEW_SIGNING_KEY;
  if (previewKey) {
    vars.push({ key: "PREVIEW_SIGNING_KEY", value: previewKey, type: "sensitive" });
  } else {
    warnings.push(
      "PREVIEW_SIGNING_KEY no está en el admin: el preview de banners queda deshabilitado en este colegio.",
    );
  }

  // CSP frame-ancestors de /preview-admin en la web.
  const origin = adminOrigin();
  if (origin) {
    vars.push({ key: "ADMIN_ORIGIN", value: origin, type: "encrypted" });
  } else {
    warnings.push(
      "No se pudo derivar el origen del admin (NEXT_PUBLIC_APP_URL): el preview no fija frame-ancestors.",
    );
  }

  for (const v of vars) {
    await upsertEnv(projectId, v.key, v.value, v.type);
  }

  return { count: vars.length, warnings };
}

async function stepVercelDomain(ctx: ProvisionContext): Promise<unknown> {
  if (!ctx.domain) return { skipped: true };

  const projectId = await ensureProjectId(ctx);
  await addDomain(projectId, ctx.domain);

  return { domain: ctx.domain };
}

async function stepVercelHook(ctx: ProvisionContext): Promise<unknown> {
  const hookUrl = await ensureDeployHookUrl(ctx);
  return { hookUrl };
}

async function stepTenantSettings(ctx: ProvisionContext): Promise<unknown> {
  if (!ctx.tenantId) throw new ProvisionError("FATAL", "Falta tenant_id del colegio.");

  const hookUrl = await ensureDeployHookUrl(ctx);

  const { error } = await ctx.admin.from("tenant_settings").upsert(
    {
      tenant_id: ctx.tenantId,
      rebuild_hook_url: hookUrl,
      preview_web_url: ctx.domain ? `https://${ctx.domain}` : "",
    },
    { onConflict: "tenant_id" },
  );
  if (error) throw error;

  const { error: updateError } = await ctx.admin
    .from("colegios")
    .update({ activo: true, domain: ctx.domain })
    .eq("id", ctx.tenantId);
  if (updateError) throw updateError;

  return { activo: true };
}

/* ── Orquestación ────────────────────────────────────────────────────────── */

async function runStep(
  ctx: ProvisionContext,
  name: string,
  fn: () => Promise<unknown>,
): Promise<void> {
  if (ctx.steps.some((s) => s.name === name && s.status === "done")) return;

  ctx.steps = markStep(ctx.steps, name, { status: "running" });
  await persistSteps(ctx, name);

  try {
    const detail = await fn();
    ctx.steps = markStep(ctx.steps, name, { status: "done", detail });
    await persistSteps(ctx, name);
  } catch (error) {
    await failJob(ctx, name, error);
    throw error;
  }
}

async function failJob(
  ctx: ProvisionContext,
  name: string,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const errorCode =
    error instanceof ProvisionError ? error.code : "RECOVERABLE";

  ctx.steps = markStep(ctx.steps, name, { status: "failed", detail: message });

  await ctx.admin.from("provisioning_jobs").update({
    status: "failed",
    current_step: name,
    steps: ctx.steps,
    error: message,
    error_code: errorCode,
  }).eq("id", ctx.jobId);
}

async function markDone(ctx: ProvisionContext): Promise<void> {
  await ctx.admin
    .from("provisioning_jobs")
    .update({ status: "done", current_step: null })
    .eq("id", ctx.jobId);
}

export async function runProvisioning(jobId: string): Promise<void> {
  const admin = createAdminClient();
  const job = await claimJob(admin, jobId);
  if (!job) return;

  const ctx: ProvisionContext = {
    admin,
    jobId,
    slug: job.slug,
    domain: job.domain ?? "",
    adminEmail: job.admin_email ?? "",
    nombre: job.nombre || humanize(job.slug),
    tenantId: job.tenant_id ?? null,
    steps: job.steps ?? [],
  };

  try {
    await runStep(ctx, "colegio", () => stepColegio(ctx));
    await runStep(ctx, "admin_user", () => stepAdminUser(ctx));
    await runStep(ctx, "seed_contenido", () => stepSeed(ctx));
    await runStep(ctx, "vercel_project", () => stepVercelProject(ctx));
    await runStep(ctx, "vercel_env", () => stepVercelEnv(ctx));
    await runStep(ctx, "vercel_domain", () => stepVercelDomain(ctx));
    await runStep(ctx, "vercel_hook", () => stepVercelHook(ctx));
    await runStep(ctx, "tenant_settings", () => stepTenantSettings(ctx));
    await markDone(ctx);
  } catch (error) {
    console.error(
      `[provision] Job ${jobId} falló en el paso ${job.current_step}:`,
      error instanceof Error ? error.message : error,
    );
  }
}
