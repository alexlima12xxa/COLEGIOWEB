"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { triggerRebuild } from "@/lib/rebuild";

export type NoticiaState = { error?: string; fieldErrors?: Record<string, string> };

// Valida y prepara los campos comunes del formulario de noticias.
function parseForm(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const resumen = String(formData.get("resumen") ?? "").trim();
  const contenido = String(formData.get("contenido") ?? "");
  const autor = String(formData.get("autor") ?? "").trim();
  const publicado = formData.get("publicado") === "on";
  const imagenAlt = String(formData.get("imagen_alt") ?? "").trim();
  const currentPath = String(formData.get("imagen_path") ?? "").trim();
  const file = formData.get("imagen") as File | null;

  const fieldErrors: Record<string, string> = {};
  if (!titulo) fieldErrors.titulo = "El título es obligatorio.";
  if (!contenido) fieldErrors.contenido = "El contenido es obligatorio.";

  return { titulo, resumen, contenido, autor, publicado, imagenAlt, currentPath, file, fieldErrors };
}

export async function crearNoticia(
  _prevState: NoticiaState,
  formData: FormData,
): Promise<NoticiaState> {
  const { supabase, tenantId } = await requireAdmin();
  const { titulo, resumen, contenido, autor, publicado, imagenAlt, currentPath, file, fieldErrors } =
    parseForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const slug = slugify(titulo);
  if (!slug) {
    return { fieldErrors: { titulo: "El título debe generar un slug válido (letras, números y espacios)." } };
  }

  // Sube la imagen al bucket "media" bajo la ruta noticias/<slug>.<ext>.
  let imagenPath = currentPath || null;
  if (file && file.size > 0) {
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const uploadPath = `noticias/${slug}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(uploadPath, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      return { error: `No se pudo subir la imagen: ${uploadError.message}` };
    }
    imagenPath = uploadPath;
  }

  const { error } = await supabase.from("noticias").insert({
    tenant_id: tenantId,
    slug,
    titulo,
    resumen: resumen || null,
    contenido,
    autor: autor || null,
    publicado,
    imagen_path: imagenPath,
    imagen_alt: imagenAlt,
  });

  if (error) {
    return { error: `No se pudo crear la noticia: ${error.message}` };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/noticias");
  redirect("/admin/noticias");
}

export async function actualizarNoticia(
  id: string,
  _prevState: NoticiaState,
  formData: FormData,
): Promise<NoticiaState> {
  const { supabase, tenantId } = await requireAdmin();
  const { titulo, resumen, contenido, autor, publicado, imagenAlt, currentPath, file, fieldErrors } =
    parseForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const slug = slugify(titulo);
  if (!slug) {
    return { fieldErrors: { titulo: "El título debe generar un slug válido (letras, números y espacios)." } };
  }

  let imagenPath = currentPath || null;
  if (file && file.size > 0) {
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const uploadPath = `noticias/${slug}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(uploadPath, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      return { error: `No se pudo subir la imagen: ${uploadError.message}` };
    }
    imagenPath = uploadPath;
  }

  const { error } = await supabase
    .from("noticias")
    .update({
      slug,
      titulo,
      resumen: resumen || null,
      contenido,
      autor: autor || null,
      publicado,
      imagen_path: imagenPath,
      imagen_alt: imagenAlt,
    })
    .eq("id", id);

  if (error) {
    return { error: `No se pudo actualizar la noticia: ${error.message}` };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/noticias");
  redirect("/admin/noticias");
}

export async function eliminarNoticia(formData: FormData) {
  const { supabase, tenantId } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) return;

  const { error } = await supabase.from("noticias").delete().eq("id", id);
  if (error) {
    throw new Error(`No se pudo eliminar la noticia: ${error.message}`);
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/noticias");
  redirect("/admin/noticias");
}
