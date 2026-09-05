"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { triggerRebuild } from "@/lib/rebuild";

export type BannersState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const PLANTILLAS = ["duotono", "granulado", "foto"] as const;

const LIMITS = {
  title: { min: 1, max: 160 },
  subtitle: { min: 0, max: 300 },
  kicker: { min: 0, max: 60 },
  ctaLabel: { min: 0, max: 80 },
  ctaHref: { min: 0, max: 500 },
  orden: { min: 0, max: 999 },
} as const;

function clampLen(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

async function uploadOrKeep(
  file: File | null,
  folder: string,
  current: string,
): Promise<{ path: string; error?: string }> {
  if (!file || file.size === 0) return { path: current };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const base = slugify(current.split("/").pop()?.split(".")[0] ?? "banner") || "banner";
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

export async function guardarBanner(
  _prev: BannersState,
  formData: FormData,
): Promise<BannersState> {
  const idRaw = String(formData.get("id") ?? "").trim();
  const plantillaId = String(formData.get("plantilla_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const kicker = String(formData.get("kicker") ?? "").trim();
  const tono = String(formData.get("tono") ?? "").trim();
  const ordenRaw = String(formData.get("orden") ?? "0").trim();
  const activo = formData.get("activo") === "on";
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaHref = String(formData.get("ctaHref") ?? "").trim();
  const currentDatosRaw = formData.get("datos_json") as string | null;

  const fieldErrors: Record<string, string> = {};
  if (!PLANTILLAS.includes(plantillaId as (typeof PLANTILLAS)[number])) {
    fieldErrors.plantillaId = "Plantilla no válida.";
  }
  const eTitle = clampLen(title, LIMITS.title);
  if (eTitle) fieldErrors.title = eTitle;
  if (title.length === 0) fieldErrors.title = "El título es obligatorio.";
  const eSubtitle = clampLen(subtitle, LIMITS.subtitle);
  if (eSubtitle) fieldErrors.subtitle = eSubtitle;
  const eKicker = clampLen(kicker, LIMITS.kicker);
  if (eKicker) fieldErrors.kicker = eKicker;
  const eCtaLabel = clampLen(ctaLabel, LIMITS.ctaLabel);
  if (eCtaLabel) fieldErrors.ctaLabel = eCtaLabel;
  const eCtaHref = clampLen(ctaHref, LIMITS.ctaHref);
  if (eCtaHref) fieldErrors.ctaHref = eCtaHref;

  let orden = 0;
  const parsedOrden = Number(ordenRaw);
  if (!Number.isInteger(parsedOrden) || parsedOrden < LIMITS.orden.min || parsedOrden > LIMITS.orden.max) {
    fieldErrors.orden = "El orden debe ser un número entero entre 0 y 999.";
  } else {
    orden = parsedOrden;
  }

  // Conserva campos no editados del JSON previo (assets decorativos, etc.)
  let prevDatos: Record<string, unknown> = {};
  if (currentDatosRaw) {
    try {
      prevDatos = JSON.parse(currentDatosRaw) as Record<string, unknown>;
    } catch {
      prevDatos = {};
    }
  }

  const backgroundFile = formData.get("background") as File | null;
  const imageFile = formData.get("image") as File | null;
  const prevBackground = typeof prevDatos.background === "string" ? prevDatos.background : "";
  const prevImage = typeof prevDatos.image === "string" ? prevDatos.image : "";

  const background = await uploadOrKeep(backgroundFile, "banners", prevBackground);
  if (background.error) return { error: background.error };
  const image = await uploadOrKeep(imageFile, "banners", prevImage);
  if (image.error) return { error: image.error };

  // Solo la plantilla "foto" exige imagen de fondo. Duotono/granulado usan
  // color/gradiente controlado y pueden no tener imagen.
  if (plantillaId === "foto" && !background.path) {
    fieldErrors.background = "Sube una imagen de fondo para el banner.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const datos: Record<string, unknown> = {
    ...prevDatos,
    background: background.path || undefined,
    image: image.path || undefined,
    title,
    subtitle: subtitle || undefined,
    kicker: kicker || undefined,
    tono: tono || undefined,
    cta:
      ctaLabel && ctaHref
        ? { label: ctaLabel, href: ctaHref, variant: "primary" }
        : undefined,
  };

  const { supabase, tenantId } = await requireAdmin();

  const fila = {
    tenant_id: tenantId,
    plantilla_id: plantillaId,
    orden,
    activo,
    datos,
  };

  let error;
  if (idRaw) {
    const res = await supabase.from("banners").update(fila).eq("id", idRaw);
    error = res.error;
  } else {
    const res = await supabase.from("banners").insert(fila);
    error = res.error;
  }

  if (error) {
    return { error: `No se pudo guardar el banner: ${error.message}` };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/banners");
  return { ok: true };
}

export async function eliminarBanner(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) {
    throw new Error(`No se pudo eliminar el banner: ${error.message}`);
  }
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/banners");
  redirect("/admin/banners");
}