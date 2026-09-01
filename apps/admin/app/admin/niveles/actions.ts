"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { triggerRebuild } from "@/lib/rebuild";

export type NivelesState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const LIMITS = {
  descripcion: { min: 10, max: 500 },
  edad: { min: 0, max: 40 },
  cta: { min: 0, max: 200 },
} as const;

function clamp(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

export const NIVELES = [
  { clave: "preescolar", label: "Preescolar" },
  { clave: "primaria", label: "Primaria" },
  { clave: "secundaria", label: "Secundaria" },
  { clave: "media-tecnica", label: "Media Técnica" },
] as const;

export type NivelClave = (typeof NIVELES)[number]["clave"];

interface NivelShape {
  headline?: string;
  description?: string;
  image?: string;
  program?: string[];
  methodology?: string;
  schedule?: { mondayFriday?: string; saturday?: string };
  cta?: string;
  ageRange?: string;
}

export async function guardarNiveles(
  _prev: NivelesState,
  formData: FormData,
): Promise<NivelesState> {
  const fieldErrors: Record<string, string> = {};
  const valor: Record<string, NivelShape> = {};

  for (const nivel of NIVELES) {
    const description = String(formData.get(`${nivel.clave}_description`) ?? "").trim();
    const ageRange = String(formData.get(`${nivel.clave}_ageRange`) ?? "").trim();
    const cta = String(formData.get(`${nivel.clave}_cta`) ?? "").trim();

    const eDesc = clamp(description, LIMITS.descripcion);
    const eEdad = clamp(ageRange, LIMITS.edad);
    const eCta = clamp(cta, LIMITS.cta);
    if (eDesc) fieldErrors[`${nivel.clave}_description`] = eDesc;
    if (eEdad) fieldErrors[`${nivel.clave}_ageRange`] = eEdad;
    if (eCta) fieldErrors[`${nivel.clave}_cta`] = eCta;

    valor[nivel.clave] = {
      description,
      ageRange: ageRange || undefined,
      cta: cta || undefined,
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

  await triggerRebuild();
  revalidatePath("/admin/niveles");
  return { ok: true };
}
