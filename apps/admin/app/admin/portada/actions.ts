"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { triggerRebuild } from "@/lib/rebuild";

export type PortadaState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const LIMITS = {
  heroTitulo: { min: 2, max: 80 },
  heroSubtitulo: { min: 2, max: 200 },
  navbarLabel: { min: 1, max: 60 },
  metricaValue: { min: 1, max: 40 },
  metricaLabel: { min: 1, max: 120 },
  pilarTitulo: { min: 3, max: 80 },
  pilarDescription: { min: 10, max: 500 },
  pilarMetric: { min: 1, max: 120 },
  pilaresTitulo: { min: 1, max: 120 },
} as const;

function clamp(
  value: string,
  limits: { min: number; max: number },
): string | null {
  const len = value.length;
  if (len < limits.min)
    return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max)
    return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

async function upsertContenido(
  clave: string,
  valor: unknown,
): Promise<PortadaState> {
  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase
    .from("contenido")
    .upsert(
      { tenant_id: tenantId, clave, valor },
      { onConflict: "tenant_id,clave" },
    );
  if (error) {
    return { error: `No se pudo guardar "${clave}": ${error.message}` };
  }
  return { ok: true };
}

// Sube un archivo al bucket "media" bajo una ruta por tenant/clave y devuelve
// la ruta relativa. Si no hay archivo, devuelve la ruta previa (sin cambios).
async function uploadOrKeep(
  file: File | null,
  folder: string,
  current: string,
): Promise<{ path: string; error?: string }> {
  if (!file || file.size === 0) return { path: current };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const base =
    slugify(current.split("/").pop()?.split(".")[0] ?? "imagen") || "imagen";
  const uploadPath = `${folder}/${base}-${Date.now()}.${ext}`;

  const { supabase } = await requireAdmin();
  const { error } = await supabase.storage
    .from("media")
    .upload(uploadPath, file, { upsert: true, contentType: file.type });

  if (error) {
    return {
      path: current,
      error: `No se pudo subir la imagen: ${error.message}`,
    };
  }
  return { path: uploadPath };
}

interface HeroShape {
  badge?: string;
  name?: string;
  slogan?: string;
  description?: string;
  heroPhoto?: string;
  tourPoster?: string;
  actions?: { label: string; href: string; variant: string }[];
}

export async function guardarHero(
  _prev: PortadaState,
  formData: FormData,
): Promise<PortadaState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const subtitulo = String(formData.get("subtitulo") ?? "").trim();
  const currentHero = formData.get("hero_json") as string | null;

  const fieldErrors: Record<string, string> = {};
  const eTitulo = clamp(titulo, LIMITS.heroTitulo);
  const eSubtitulo = clamp(subtitulo, LIMITS.heroSubtitulo);
  if (eTitulo) fieldErrors.titulo = eTitulo;
  if (eSubtitulo) fieldErrors.subtitulo = eSubtitulo;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // Estado actual del hero (para conservar campos no editados como actions).
  let prev: HeroShape = {};
  if (currentHero) {
    try {
      prev = JSON.parse(currentHero) as HeroShape;
    } catch {
      prev = {};
    }
  }

  const heroFile = formData.get("heroPhoto") as File | null;
  const heroPhoto = await uploadOrKeep(
    heroFile,
    "portada",
    prev.heroPhoto ?? "",
  );
  if (heroPhoto.error) return { error: heroPhoto.error };

  const valor: HeroShape = {
    ...prev,
    name: prev.name ?? titulo,
    slogan: prev.slogan ?? subtitulo,
    description: prev.description ?? subtitulo,
    heroPhoto: heroPhoto.path,
  };
  if (titulo) valor.name = titulo;
  if (subtitulo) valor.slogan = subtitulo;

  const res = await upsertContenido("hero", valor);
  if (res.error) return res;

  const { supabase, tenantId } = await requireAdmin();
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/portada");
  return { ok: true };
}

// ── Navbar (clave `navbar`) ─────────────────────────────────────────────────
// Lista fija de enlaces [{label, href}]. Logo y nombre siguen en config.

const NAVBAR_COUNT = 7;

const NAVBAR_ROUTES = [
  "/",
  "/nosotros",
  "/niveles",
  "/admisiones",
  "/noticias",
  "/circulares",
  "/contacto",
];

export async function guardarNavbar(
  _prev: PortadaState,
  formData: FormData,
): Promise<PortadaState> {
  const fieldErrors: Record<string, string> = {};
  const links: { label: string; href: string }[] = [];

  for (let i = 0; i < NAVBAR_COUNT; i++) {
    const label = String(formData.get(`label_${i}`) ?? "").trim();
    const href = String(formData.get(`href_${i}`) ?? "").trim();
    if (!label && !href) continue;

    const eLabel = clamp(label, LIMITS.navbarLabel);
    if (eLabel) fieldErrors[`label_${i}`] = eLabel;

    if (!NAVBAR_ROUTES.includes(href)) {
      fieldErrors[`href_${i}`] = "Elige una página existente.";
    }
    links.push({ label, href });
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  if (links.length === 0) {
    return { fieldErrors: { _form: "Añade al menos un enlace." } };
  }

  const res = await upsertContenido("navbar", { links });
  if (res.error) return res;

  const { supabase, tenantId } = await requireAdmin();
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/portada");
  return { ok: true };
}

// ── Métricas (clave `metricas`) ─────────────────────────────────────────────
// 4 métricas fijas [{value, label}] de la franja de datos.

const METRICAS_COUNT = 4;

export async function guardarMetricas(
  _prev: PortadaState,
  formData: FormData,
): Promise<PortadaState> {
  const fieldErrors: Record<string, string> = {};
  const metricas: { value: string; label: string }[] = [];

  for (let i = 0; i < METRICAS_COUNT; i++) {
    const value = String(formData.get(`value_${i}`) ?? "").trim();
    const label = String(formData.get(`label_${i}`) ?? "").trim();
    if (!value && !label) continue;

    const eValue = clamp(value, LIMITS.metricaValue);
    const eLabel = clamp(label, LIMITS.metricaLabel);
    if (eValue) fieldErrors[`value_${i}`] = eValue;
    if (eLabel) fieldErrors[`label_${i}`] = eLabel;
    metricas.push({ value, label });
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  if (metricas.length === 0) {
    return { fieldErrors: { _form: "Añade al menos una métrica." } };
  }

  const res = await upsertContenido("metricas", metricas);
  if (res.error) return res;

  const { supabase, tenantId } = await requireAdmin();
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/portada");
  return { ok: true };
}

// ── Pilares (clave `pilares`) ────────────────────────────────────────────────
// {titulo, items: [{title, description, metric}]} — 4 pilares fijos.

const PILARES_COUNT = 4;

export async function guardarPilares(
  _prev: PortadaState,
  formData: FormData,
): Promise<PortadaState> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const fieldErrors: Record<string, string> = {};

  const eTitulo = clamp(titulo, LIMITS.pilaresTitulo);
  if (eTitulo) fieldErrors.titulo = eTitulo;

  const items: { title: string; description: string; metric: string }[] = [];

  for (let i = 0; i < PILARES_COUNT; i++) {
    const title = String(formData.get(`title_${i}`) ?? "").trim();
    const description = String(formData.get(`description_${i}`) ?? "").trim();
    const metric = String(formData.get(`metric_${i}`) ?? "").trim();
    if (!title && !description && !metric) continue;

    const eTitle = clamp(title, LIMITS.pilarTitulo);
    const eDescription = clamp(description, LIMITS.pilarDescription);
    const eMetric = clamp(metric, LIMITS.pilarMetric);
    if (eTitle) fieldErrors[`title_${i}`] = eTitle;
    if (eDescription) fieldErrors[`description_${i}`] = eDescription;
    if (eMetric) fieldErrors[`metric_${i}`] = eMetric;
    items.push({ title, description, metric });
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  if (items.length === 0) {
    return { fieldErrors: { _form: "Añade al menos un pilar." } };
  }

  const res = await upsertContenido("pilares", { titulo, items });
  if (res.error) return res;

  const { supabase, tenantId } = await requireAdmin();
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/portada");
  return { ok: true };
}
