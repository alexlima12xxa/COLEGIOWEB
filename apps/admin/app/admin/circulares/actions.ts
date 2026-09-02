"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { triggerRebuild } from "@/lib/rebuild";

export type CircularState = { error?: string; fieldErrors?: Record<string, string> };

function parseForm(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const fecha = String(formData.get("fecha") ?? "");
  const publicado = formData.get("publicado") === "on";
  const currentPath = String(formData.get("archivo_path") ?? "").trim();
  const currentNombre = String(formData.get("archivo_nombre") ?? "").trim();
  const file = formData.get("archivo") as File | null;

  const fieldErrors: Record<string, string> = {};
  if (!titulo) fieldErrors.titulo = "El título es obligatorio.";
  if (!fecha) fieldErrors.fecha = "La fecha es obligatoria.";
  if (file && file.size > 0 && file.type !== "application/pdf") {
    fieldErrors.archivo = "El archivo debe ser un PDF.";
  }

  return { titulo, descripcion, categoria, fecha, publicado, currentPath, currentNombre, file, fieldErrors };
}

async function uploadArchivo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  titulo: string,
  file: File,
): Promise<{ path: string; nombre: string } | { error: string }> {
  const base = slugify(titulo) || "circular";
  const ext = "pdf";
  const uploadPath = `circulares/${base}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(uploadPath, file, { upsert: true, contentType: file.type });
  if (error) {
    return { error: `No se pudo subir el PDF: ${error.message}` };
  }
  return { path: uploadPath, nombre: file.name };
}

export async function crearCircular(
  _prevState: CircularState,
  formData: FormData,
): Promise<CircularState> {
  const { supabase, tenantId } = await requireAdmin();
  const { titulo, descripcion, categoria, fecha, publicado, currentPath, currentNombre, file, fieldErrors } =
    parseForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  let archivoPath = currentPath || null;
  let archivoNombre = currentNombre || null;
  if (file && file.size > 0) {
    const result = await uploadArchivo(supabase, titulo, file);
    if ("error" in result) return { error: result.error };
    archivoPath = result.path;
    archivoNombre = result.nombre;
  }

  const { error } = await supabase.from("circulares").insert({
    tenant_id: tenantId,
    titulo,
    descripcion: descripcion || null,
    categoria: categoria || null,
    fecha,
    archivo_path: archivoPath,
    archivo_nombre: archivoNombre,
    publicado,
  });

  if (error) {
    return { error: `No se pudo crear la circular: ${error.message}` };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/circulares");
  redirect("/admin/circulares");
}

export async function actualizarCircular(
  id: string,
  _prevState: CircularState,
  formData: FormData,
): Promise<CircularState> {
  const { supabase, tenantId } = await requireAdmin();
  const { titulo, descripcion, categoria, fecha, publicado, currentPath, currentNombre, file, fieldErrors } =
    parseForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  let archivoPath = currentPath || null;
  let archivoNombre = currentNombre || null;
  if (file && file.size > 0) {
    const result = await uploadArchivo(supabase, titulo, file);
    if ("error" in result) return { error: result.error };
    archivoPath = result.path;
    archivoNombre = result.nombre;
  }

  const { error } = await supabase
    .from("circulares")
    .update({
      titulo,
      descripcion: descripcion || null,
      categoria: categoria || null,
      fecha,
      archivo_path: archivoPath,
      archivo_nombre: archivoNombre,
      publicado,
    })
    .eq("id", id);

  if (error) {
    return { error: `No se pudo actualizar la circular: ${error.message}` };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/circulares");
  redirect("/admin/circulares");
}

export async function eliminarCircular(formData: FormData) {
  const { supabase, tenantId } = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!id) return;

  const { error } = await supabase.from("circulares").delete().eq("id", id);
  if (error) {
    throw new Error(`No se pudo eliminar la circular: ${error.message}`);
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/circulares");
  redirect("/admin/circulares");
}