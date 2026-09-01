"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export type GaleriaState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const LIMITS = {
  titulo: { min: 0, max: 120 },
  categoria: { min: 0, max: 80 },
  alt: { min: 0, max: 200 },
} as const;

function clamp(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

export interface GaleriaItem {
  src: string;
  alt: string;
  variant?: string;
  title?: string;
  category?: string;
  order?: number;
}

// Sube una imagen al bucket "media" bajo la ruta galeria/<slug>-<ts>.<ext>.
// Si no hay archivo, conserva la ruta previa.
async function uploadOrKeep(
  file: File | null,
  current: string,
): Promise<{ path?: string; error?: string }> {
  if (!file || file.size === 0) return { path: current || undefined };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const base =
    slugify(current.split("/").pop()?.split(".")[0] ?? "imagen") || "imagen";
  const uploadPath = `galeria/${base}-${Date.now()}.${ext}`;

  const { supabase } = await requireAdmin();
  const { error } = await supabase.storage
    .from("media")
    .upload(uploadPath, file, { upsert: true, contentType: file.type });

  if (error) {
    return { error: `No se pudo subir la imagen: ${error.message}` };
  }
  return { path: uploadPath };
}

export async function guardarGaleria(
  _prev: GaleriaState,
  formData: FormData,
): Promise<GaleriaState> {
  const titulos = formData.getAll("title");
  const categorias = formData.getAll("category");
  const alts = formData.getAll("alt");
  const ordenes = formData.getAll("order");
  const imagenes = formData.getAll("image") as File[];
  const rutasPrevias = formData.getAll("image_path") as string[];

  const fieldErrors: Record<string, string> = {};
  const items: GaleriaItem[] = [];
  const count = Math.max(titulos.length, categorias.length, alts.length, ordenes.length);

  for (let i = 0; i < count; i++) {
    const title = String(titulos[i] ?? "").trim();
    const category = String(categorias[i] ?? "").trim();
    const alt = String(alts[i] ?? "").trim();
    const orderRaw = String(ordenes[i] ?? "").trim();

    const eTitle = clamp(title, LIMITS.titulo);
    const eCategory = clamp(category, LIMITS.categoria);
    const eAlt = clamp(alt, LIMITS.alt);
    if (eTitle) fieldErrors[`title-${i}`] = eTitle;
    if (eCategory) fieldErrors[`category-${i}`] = eCategory;
    if (eAlt) fieldErrors[`alt-${i}`] = eAlt;

    const file = imagenes[i] as File | undefined;
    const prevPath = rutasPrevias[i] ?? "";
    const hasNewFile = Boolean(file && file.size > 0);

    // Una fila solo se incluye si tiene imagen (nueva o previa).
    if (!hasNewFile && !prevPath) continue;

    const upload = await uploadOrKeep(file ?? null, prevPath);
    if (upload.error) return { error: upload.error };

    const order = orderRaw === "" ? undefined : Number(orderRaw);

    items.push({
      src: upload.path ?? "",
      alt,
      variant: "default",
      title: title || undefined,
      category: category || undefined,
      order: Number.isFinite(order) ? order : undefined,
    });
  }

  if (items.length < 1) {
    fieldErrors._form = "Agrega al menos una imagen a la galería.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase.from("contenido").upsert(
    { tenant_id: tenantId, clave: "galeria", valor: items },
    { onConflict: "tenant_id,clave" },
  );
  if (error) {
    return { error: `No se pudo guardar "galeria": ${error.message}` };
  }

  revalidatePath("/admin/galeria");
  return { ok: true };
}
