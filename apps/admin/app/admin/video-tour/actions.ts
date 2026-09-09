"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { triggerRebuild } from "@/lib/rebuild";

export type VideoTourState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const LIMITS = {
  videoUrl: { min: 5, max: 500 },
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
): Promise<VideoTourState> {
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

// Sube un archivo al bucket "media" y devuelve la ruta relativa. Si no hay
// archivo, devuelve la ruta previa (sin cambios).
async function uploadOrKeep(
  file: File | null,
  folder: string,
  current: string,
): Promise<{ path: string; error?: string }> {
  if (!file || file.size === 0) return { path: current };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const base = "tour-poster";
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

interface VideoTourShape {
  videoUrl?: string;
  poster?: string;
  title?: string;
  description?: string;
}

export async function guardarVideoTour(
  _prev: VideoTourState,
  formData: FormData,
): Promise<VideoTourState> {
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();
  const currentPoster = formData.get("poster_json") as string | null;
  const posterTitle = String(formData.get("posterTitle") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  const eUrl = clamp(videoUrl, LIMITS.videoUrl);
  if (eUrl) fieldErrors.videoUrl = eUrl;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  let prev: VideoTourShape = {};
  if (currentPoster) {
    try {
      prev = JSON.parse(currentPoster) as VideoTourShape;
    } catch {
      prev = {};
    }
  }

  const posterFile = formData.get("poster") as File | null;
  const poster = await uploadOrKeep(posterFile, "portada", prev.poster ?? "");
  if (poster.error) return { error: poster.error };

  const valor: VideoTourShape = {
    ...prev,
    videoUrl,
    poster: poster.path,
    title: posterTitle || prev.title || "Tour virtual",
  };

  const res = await upsertContenido("video_tour", valor);
  if (res.error) return res;

  const { supabase, tenantId } = await requireAdmin();
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/video-tour");
  return { ok: true };
}
