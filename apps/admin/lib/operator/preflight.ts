import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase-admin";
import { getProject } from "./vercel";

// Validación previa a tocar nada: comprueba formato y unicidad de slug/dominio,
// la invariante 1:1 del email del director y si el proyecto Vercel ya existe.
// Devuelve { ok, errors, warnings } SIN lanzar (la saga sí lanza y captura por
// paso). Ver reports/2026-09-21_alta-colegios-operador.md (F2/F3).

export interface PreflightInput {
  slug: string;
  domain: string;
  adminEmail: string;
  nombre?: string;
}

export interface PreflightResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HOSTNAME_RE =
  /^(?=[a-z0-9.-]{1,253}$)(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .trim()
    .toLowerCase();
}

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Busca un usuario de Auth por email (listUsers paginado). Devuelve null si no
// existe. Lanza si la API de Auth falla (lo captura preflight).
async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<User | null> {
  const needle = email.toLowerCase();
  const perPage = 1000;
  let page = 1;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`No se pudo listar usuarios: ${error.message}`);

    const users = data?.users ?? [];
    const found = users.find((u) => (u.email ?? "").toLowerCase() === needle);
    if (found) return found;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

export async function preflight(input: PreflightInput): Promise<PreflightResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const slug = input.slug.trim();
  const domain = normalizeDomain(input.domain);
  const adminEmail = input.adminEmail.trim().toLowerCase();

  if (!SLUG_RE.test(slug)) {
    errors.push("El slug solo admite minúsculas, números y guiones (ej. colegio-norte).");
  }

  if (!HOSTNAME_RE.test(domain)) {
    errors.push("El dominio no es un hostname válido (ej. micolegio.edu.co).");
  }

  const admin = createAdminClient();

  // Unicidad de slug (BD).
  try {
    const { data, error } = await admin
      .from("colegios")
      .select("id, slug")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (data) errors.push(`El slug "${slug}" ya existe en la base de datos.`);
  } catch (error) {
    errors.push(`No se pudo validar el slug en la BD: ${errMsg(error)}`);
  }

  // Unicidad de dominio (BD, case-insensitive).
  try {
    const { data, error } = await admin
      .from("colegios")
      .select("id, slug")
      .ilike("domain", domain)
      .maybeSingle();
    if (error) throw error;
    if (data) errors.push(`El dominio "${domain}" ya está en uso por otro colegio.`);
  } catch (error) {
    errors.push(`No se pudo validar el dominio en la BD: ${errMsg(error)}`);
  }

  // Invariante 1:1 del email del director.
  try {
    const existingUser = await findUserByEmail(admin, adminEmail);
    if (existingUser?.app_metadata?.tenant_id) {
      errors.push(
        `El email "${adminEmail}" ya es admin de otro colegio (1 email = 1 colegio).`,
      );
    }
  } catch (error) {
    errors.push(`No se pudo validar el email en Auth: ${errMsg(error)}`);
  }

  // Proyecto Vercel (create-or-retrieve; no bloquea).
  try {
    const project = await getProject(`web-${slug}`);
    if (project) {
      warnings.push(`El proyecto Vercel "web-${slug}" ya existe; se reutilizará.`);
    }
  } catch (error) {
    warnings.push(
      `No se pudo consultar el proyecto Vercel (${errMsg(error)}); se intentará crear en la provisión.`,
    );
  }

  // Gate de fase código (humano, ver F3).
  warnings.push(
    `Confirma que la fase código ya está mergeada y desplegada: ` +
      `apps/web/src/configs/${slug}.ts, apps/web/public/branding/${slug}/ ` +
      `y la entrada en clients.json (domain=${domain}).`,
  );

  return { ok: errors.length === 0, errors, warnings };
}
