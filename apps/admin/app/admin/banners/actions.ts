"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { triggerRebuild } from "@/lib/rebuild";
import { BANNERS_SLUGS, catalogoPorSlug } from "@web-modelo/shared";

export type BannersState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const PLANTILLAS = BANNERS_SLUGS;

// Los máximos de title/subtitle/kicker deben coincidir con `maxLength` del
// contrato en packages/shared/src/banners/catalogo.ts (fuente de verdad del
// formulario y del contador). Mantenerlos sincronizados al agregar plantillas.
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

// Convierte una imagen en data-URL (edición inline) en un archivo subido.
// Devuelve la ruta de storage; si no puede, devuelve la cadena original para
// no perder el dato. Evita persistir base64 gigante en `datos jsonb`.
async function uploadDataUrl(
  dataUrl: string,
  folder: string,
): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return dataUrl;
  const mime = match[1];
  try {
    const file = dataUrlToFile(dataUrl, mime, "banner");
    const { supabase } = await requireAdmin();
    const uploadPath = `${folder}/banner-${Date.now()}.${extFromMime(mime)}`;
    const { error } = await supabase.storage
      .from("media")
      .upload(uploadPath, file, { upsert: true, contentType: mime });
    if (error) return dataUrl;
    return uploadPath;
  } catch {
    return dataUrl;
  }
}

function extFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("avif")) return "avif";
  return "jpg";
}

function dataUrlToFile(dataUrl: string, mime: string, name: string): File {
  const b64 = dataUrl.split(",")[1] ?? "";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name, { type: mime });
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

  // Valida que `tono` (si viene) pertenezca a las opciones controladas de la
  // paleta de la plantilla elegida. Evita persistir claves inválidas.
  const campoTono = catalogoPorSlug(plantillaId)?.contrato.campos.find(
    (c) => c.key === "tono" && c.tipo === "opciones",
  );
  if (campoTono?.opciones?.length && tono && !campoTono.opciones.some((o) => o.value === tono)) {
    fieldErrors.tono = "Tono no válido para esta plantilla.";
  }
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

  let background = await uploadOrKeep(backgroundFile, "banners", prevBackground);
  if (background.error) return { error: background.error };
  if (!backgroundFile && prevBackground.startsWith("data:")) {
    background = { path: await uploadDataUrl(prevBackground, "banners") };
  }

  let image = await uploadOrKeep(imageFile, "banners", prevImage);
  if (image.error) return { error: image.error };
  if (!imageFile && prevImage.startsWith("data:")) {
    image = { path: await uploadDataUrl(prevImage, "banners") };
  }

  // Solo la plantilla "foto" exige imagen de fondo. Duotono/granulado usan
  // color/gradiente controlado y pueden no tener imagen.
  if (plantillaId === "foto" && !background.path) {
    fieldErrors.background = "Sube una imagen de fondo para el banner.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // CTA y botones secundarios: fuente de verdad es `datos_json` (donde el
  // preview inline también escribe). Como fallback, si vienen ctaLabel/ctaHref
  // por formData (edición por formulario), se construyen sobre eso.
  const prevCta = prevDatos.cta as
    | { label?: string; href?: string; variant?: string }
    | undefined;
  const cta: Record<string, unknown> | undefined =
    ctaLabel && ctaHref
      ? { label: ctaLabel, href: ctaHref, variant: "primary" }
      : prevCta?.label && prevCta?.href
        ? prevCta
        : undefined;

  const prevActions = Array.isArray(prevDatos.actions)
    ? (prevDatos.actions as Record<string, unknown>[])
    : [];

  const datos: Record<string, unknown> = {
    ...prevDatos,
    background: background.path || undefined,
    image: image.path || undefined,
    title,
    subtitle: subtitle || undefined,
    kicker: kicker || undefined,
    tono: tono || undefined,
    cta,
    actions: prevActions,
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

// Subida inmediata de imagen desde el editor (antes de guardar el banner).
// Devuelve la ruta relativa del bucket "media" para que el preview híbrido
// pueda mostrarlo en el iframe sin transportar data-URL gigante por query.
export async function subirImagenBanner(
  formData: FormData,
): Promise<{ path: string; error?: string }> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { path: "", error: "Archivo vacío." };
  const ext = slugify(file.name.split(".").pop() ?? "jpg") || "jpg";
  const uploadPath = `banners/temp-${Date.now()}.${ext.toLowerCase()}`;

  const { supabase } = await requireAdmin();
  const { error } = await supabase.storage
    .from("media")
    .upload(uploadPath, file, { upsert: true, contentType: file.type });

  if (error) {
    return { path: "", error: `No se pudo subir la imagen: ${error.message}` };
  }
  return { path: uploadPath };
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

export async function alternarBannerActivo(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const activo = formData.get("activo") === "on";
  if (!id) return;
  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase.from("banners").update({ activo }).eq("id", id);
  if (error) {
    throw new Error(`No se pudo actualizar el banner: ${error.message}`);
  }
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/banners");
}

export async function duplicarBanner(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const { supabase, tenantId } = await requireAdmin();

  const { data: origen } = await supabase
    .from("banners")
    .select("id, plantilla_id, orden, activo, datos")
    .eq("id", id)
    .maybeSingle();

  if (!origen) throw new Error("No se encontró el banner a duplicar.");

  const datos: Record<string, unknown> = {
    ...(origen.datos && typeof origen.datos === "object" && !Array.isArray(origen.datos)
      ? origen.datos
      : {}),
  };
  if (typeof datos.title === "string" && datos.title) {
    datos.title = `${datos.title} (copia)`;
  }

  const { error } = await supabase.from("banners").insert({
    tenant_id: tenantId,
    plantilla_id: origen.plantilla_id,
    orden: (origen.orden ?? 0) + 1,
    activo: false,
    datos,
  });

  if (error) {
    throw new Error(`No se pudo duplicar el banner: ${error.message}`);
  }
  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/banners");
}