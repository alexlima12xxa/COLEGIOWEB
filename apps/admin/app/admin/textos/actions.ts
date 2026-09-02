"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { triggerRebuild } from "@/lib/rebuild";

export type ContenidoState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Límites de longitud por campo (task 4: validación mínima/máxima).
const LIMITS = {
  mision: { min: 20, max: 1000 },
  vision: { min: 20, max: 1000 },
  filosofiaTitle: { min: 3, max: 80 },
  filosofiaDesc: { min: 10, max: 500 },
  historiaAnio: { min: 1, max: 10 },
  historiaTitulo: { min: 3, max: 120 },
  historiaDesc: { min: 10, max: 1000 },
} as const;

function clamp(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

interface UpsertArgs {
  clave: string;
  valor: unknown;
}

// Upsert por (tenant_id, clave): si existe se actualiza, si no se inserta.
async function upsertContenido({ clave, valor }: UpsertArgs): Promise<ContenidoState> {
  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase.from("contenido").upsert(
    { tenant_id: tenantId, clave, valor },
    { onConflict: "tenant_id,clave" },
  );
  if (error) {
    return { error: `No se pudo guardar "${clave}": ${error.message}` };
  }
  return { ok: true };
}

export async function guardarMision(
  _prev: ContenidoState,
  formData: FormData,
): Promise<ContenidoState> {
  const mision = String(formData.get("mision") ?? "").trim();
  const vision = String(formData.get("vision") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  const eMision = clamp(mision, LIMITS.mision);
  const eVision = clamp(vision, LIMITS.vision);
  if (eMision) fieldErrors.mision = eMision;
  if (eVision) fieldErrors.vision = eVision;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const misionRes = await upsertContenido({ clave: "mision", valor: mision });
  if (misionRes.error) return misionRes;
  const visionRes = await upsertContenido({ clave: "vision", valor: vision });
  if (visionRes.error) return visionRes;

  const { supabase, tenantId } = await requireAdmin();
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/textos");
  return { ok: true };
}

export async function guardarFilosofia(
  _prev: ContenidoState,
  formData: FormData,
): Promise<ContenidoState> {
  const titles = formData.getAll("title");
  const descriptions = formData.getAll("description");

  const fieldErrors: Record<string, string> = {};
  const pilares: { title: string; description: string }[] = [];
  const count = Math.max(titles.length, descriptions.length);

  for (let i = 0; i < count; i++) {
    const title = String(titles[i] ?? "").trim();
    const description = String(descriptions[i] ?? "").trim();
    const eTitle = clamp(title, LIMITS.filosofiaTitle);
    const eDesc = clamp(description, LIMITS.filosofiaDesc);
    if (eTitle) fieldErrors[`title-${i}`] = eTitle;
    if (eDesc) fieldErrors[`description-${i}`] = eDesc;
    if (title || description) {
      pilares.push({ title, description });
    }
  }

  if (pilares.length < 1) {
    fieldErrors._form = "Agrega al menos un pilar de filosofía.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const res = await upsertContenido({ clave: "filosofia", valor: pilares });
  if (res.error) return res;

  const { supabase, tenantId } = await requireAdmin();
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/textos");
  return { ok: true };
}

export async function guardarHistoria(
  _prev: ContenidoState,
  formData: FormData,
): Promise<ContenidoState> {
  const anios = formData.getAll("anio");
  const titulos = formData.getAll("titulo");
  const descripciones = formData.getAll("descripcion");

  const fieldErrors: Record<string, string> = {};
  const hitos: { title: string; date: string; description: string }[] = [];
  const count = Math.max(anios.length, titulos.length, descripciones.length);

  for (let i = 0; i < count; i++) {
    const anio = String(anios[i] ?? "").trim();
    const titulo = String(titulos[i] ?? "").trim();
    const descripcion = String(descripciones[i] ?? "").trim();
    const eAnio = clamp(anio, LIMITS.historiaAnio);
    const eTitulo = clamp(titulo, LIMITS.historiaTitulo);
    const eDesc = clamp(descripcion, LIMITS.historiaDesc);
    if (eAnio) fieldErrors[`anio-${i}`] = eAnio;
    if (eTitulo) fieldErrors[`titulo-${i}`] = eTitulo;
    if (eDesc) fieldErrors[`descripcion-${i}`] = eDesc;
    if (anio || titulo || descripcion) {
      hitos.push({ title: titulo, date: anio, description: descripcion });
    }
  }

  if (hitos.length < 1) {
    fieldErrors._form = "Agrega al menos un hito de la historia.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const res = await upsertContenido({ clave: "historia", valor: hitos });
  if (res.error) return res;

  const { supabase, tenantId } = await requireAdmin();
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/textos");
  return { ok: true };
}
