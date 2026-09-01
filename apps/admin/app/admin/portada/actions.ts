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
  videoUrl: { min: 5, max: 500 },
  videoPosterAlt: { min: 0, max: 200 },
} as const;

function clamp(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

async function upsertContenido(
  clave: string,
  valor: unknown,
): Promise<PortadaState> {
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

// Sube un archivo al bucket "media" bajo una ruta por tenant/clave y devuelve
// la ruta relativa. Si no hay archivo, devuelve la ruta previa (sin cambios).
async function uploadOrKeep(
  file: File | null,
  folder: string,
  current: string,
): Promise<{ path: string; error?: string }> {
  if (!file || file.size === 0) return { path: current };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const base = slugify(current.split("/").pop()?.split(".")[0] ?? "imagen") || "imagen";
  const uploadPath = `${folder}/${base}-${Date.now()}.${ext}`;

  const { supabase } = await requireAdmin();
  const { error } = await supabase.storage
    .from("media")
    .upload(uploadPath, file, { upsert: true, contentType: file.type });

  if (error) {
    return { path: current, error: `No se pudo subir la imagen: ${error.message}` };
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
  const heroPhoto = await uploadOrKeep(heroFile, "portada", prev.heroPhoto ?? "");
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

  await triggerRebuild();
  revalidatePath("/admin/portada");
  return { ok: true };
}

interface VideoTourShape {
  videoUrl?: string;
  poster?: string;
  title?: string;
  description?: string;
}

export async function guardarVideoTour(
  _prev: PortadaState,
  formData: FormData,
): Promise<PortadaState> {
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

  await triggerRebuild();
  revalidatePath("/admin/portada");
  return { ok: true };
}
