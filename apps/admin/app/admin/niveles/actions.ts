"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { triggerRebuild } from "@/lib/rebuild";
import { NIVELES, PAGINAS_CTA } from "./niveles-constants";

export type NivelesState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const LIMITS = {
  name: { min: 2, max: 40 },
  edad: { min: 0, max: 40 },
  subtitle: { min: 0, max: 120 },
  headline: { min: 3, max: 200 },
  descripcion: { min: 10, max: 1000 },
  methodology: { min: 10, max: 2000 },
  schedule: { min: 1, max: 100 },
  cta: { min: 3, max: 160 },
  programItem: { min: 1, max: 300 },
} as const;

function clamp(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

// Si no hay archivo, conserva la ruta previa.
async function uploadOrKeep(
  file: File | null,
  current: string,
): Promise<{ path?: string; error?: string }> {
  if (!file || file.size === 0) return { path: current || undefined };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const base =
    slugify(current.split("/").pop()?.split(".")[0] ?? "nivel") || "nivel";
  const uploadPath = `niveles/${base}-${Date.now()}.${ext}`;

  const { supabase } = await requireAdmin();
  const { error } = await supabase.storage
    .from("media")
    .upload(uploadPath, file, { upsert: true, contentType: file.type });

  if (error) {
    return { error: `No se pudo subir la imagen: ${error.message}` };
  }
  return { path: uploadPath };
}

export interface NivelShape {
  name?: string;
  ageRange?: string;
  subtitle?: string;
  subtitleVisible?: boolean;
  enabled?: boolean;
  headline?: string;
  description?: string;
  image?: string;
  program?: string[];
  methodology?: string;
  schedule?: { mondayFriday?: string; saturday?: string };
  cta?: string;
  ctaHref?: string;
}

export async function guardarNiveles(
  _prev: NivelesState,
  formData: FormData,
): Promise<NivelesState> {
  const fieldErrors: Record<string, string> = {};
  const valor: Record<string, NivelShape> = {};

  for (const nivel of NIVELES) {
    const clave = nivel.clave;
    const name = String(formData.get(`${clave}_name`) ?? "").trim();
    const ageRange = String(formData.get(`${clave}_ageRange`) ?? "").trim();
    const subtitle = String(formData.get(`${clave}_subtitle`) ?? "").trim();
    const subtitleVisible = formData.get(`${clave}_subtitleVisible`) === "on";
    const enabled = formData.get(`${clave}_enabled`) === "on";
    const headline = String(formData.get(`${clave}_headline`) ?? "").trim();
    const description = String(formData.get(`${clave}_description`) ?? "").trim();
    const methodology = String(formData.get(`${clave}_methodology`) ?? "").trim();
    const mondayFriday = String(formData.get(`${clave}_schedule_mondayFriday`) ?? "").trim();
    const saturday = String(formData.get(`${clave}_schedule_saturday`) ?? "").trim();
    const cta = String(formData.get(`${clave}_cta`) ?? "").trim();
    const ctaHref = String(formData.get(`${clave}_ctaHref`) ?? "").trim();
    const program = (formData.getAll(`${clave}_program`) as string[])
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const eName = clamp(name, LIMITS.name);
    const eEdad = clamp(ageRange, LIMITS.edad);
    const eSubtitle = clamp(subtitle, LIMITS.subtitle);
    const eHeadline = clamp(headline, LIMITS.headline);
    const eDesc = clamp(description, LIMITS.descripcion);
    const eMethod = clamp(methodology, LIMITS.methodology);
    const eLunVie = clamp(mondayFriday, LIMITS.schedule);
    const eSab = clamp(saturday, LIMITS.schedule);
    const eCta = clamp(cta, LIMITS.cta);

    if (eName) fieldErrors[`${clave}_name`] = eName;
    if (eEdad) fieldErrors[`${clave}_ageRange`] = eEdad;
    if (eSubtitle) fieldErrors[`${clave}_subtitle`] = eSubtitle;
    if (eHeadline) fieldErrors[`${clave}_headline`] = eHeadline;
    if (eDesc) fieldErrors[`${clave}_description`] = eDesc;
    if (eMethod) fieldErrors[`${clave}_methodology`] = eMethod;
    if (eLunVie) fieldErrors[`${clave}_schedule_mondayFriday`] = eLunVie;
    if (eSab) fieldErrors[`${clave}_schedule_saturday`] = eSab;
    if (eCta) fieldErrors[`${clave}_cta`] = eCta;
    if (ctaHref && !(PAGINAS_CTA as readonly string[]).includes(ctaHref)) {
      fieldErrors[`${clave}_ctaHref`] = "Elige una página existente.";
    }

    for (const [i, item] of program.entries()) {
      const eItem = clamp(item, LIMITS.programItem);
      if (eItem) fieldErrors[`${clave}_program_${i}`] = eItem;
    }
    if (program.length === 0) {
      fieldErrors[`${clave}_program`] = "Agrega al menos un área del programa.";
    }

    const imageFile = formData.get(`${clave}_image`) as File | null;
    const prevImage = String(formData.get(`${clave}_image_path`) ?? "").trim();
    const upload = await uploadOrKeep(imageFile, prevImage);
    if (upload.error) return { error: upload.error };

    valor[nivel.clave] = {
      name,
      ageRange: ageRange || undefined,
      subtitle: subtitle || undefined,
      subtitleVisible: subtitleVisible && subtitle.length > 0,
      enabled,
      headline,
      description,
      image: upload.path,
      program,
      methodology,
      schedule: { mondayFriday, saturday },
      cta,
      ctaHref,
    };
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase.from("contenido").upsert(
    { tenant_id: tenantId, clave: "niveles", valor },
    { onConflict: "tenant_id,clave" },
  );
  if (error) {
    return { error: `No se pudo guardar "niveles": ${error.message}` };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/niveles");
  return { ok: true };
}