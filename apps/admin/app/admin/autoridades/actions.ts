"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { triggerRebuild } from "@/lib/rebuild";

export type AutoridadesState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const LIMITS = {
  nombre: { min: 2, max: 120 },
  cargo: { min: 2, max: 120 },
  bio: { min: 0, max: 1000 },
} as const;

function clamp(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

export interface Autoridad {
  name: string;
  role: string;
  image?: string;
  bio?: string;
}

// Sube una foto al bucket "media" bajo la ruta autoridades/<slug>-<ts>.<ext>.
// Si no hay archivo, conserva la ruta previa.
async function uploadOrKeep(
  file: File | null,
  current: string,
): Promise<{ path?: string; error?: string }> {
  if (!file || file.size === 0) return { path: current || undefined };

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const base =
    slugify(current.split("/").pop()?.split(".")[0] ?? "autoridad") || "autoridad";
  const uploadPath = `autoridades/${base}-${Date.now()}.${ext}`;

  const { supabase } = await requireAdmin();
  const { error } = await supabase.storage
    .from("media")
    .upload(uploadPath, file, { upsert: true, contentType: file.type });

  if (error) {
    return { error: `No se pudo subir la foto: ${error.message}` };
  }
  return { path: uploadPath };
}

export async function guardarAutoridades(
  _prev: AutoridadesState,
  formData: FormData,
): Promise<AutoridadesState> {
  const nombres = formData.getAll("name");
  const cargos = formData.getAll("role");
  const bios = formData.getAll("bio");
  const imagenes = formData.getAll("image") as File[];
  const rutasPrevias = formData.getAll("image_path") as string[];

  const fieldErrors: Record<string, string> = {};
  const autoridades: Autoridad[] = [];
  const count = Math.max(nombres.length, cargos.length, bios.length);

  for (let i = 0; i < count; i++) {
    const name = String(nombres[i] ?? "").trim();
    const role = String(cargos[i] ?? "").trim();
    const bio = String(bios[i] ?? "").trim();

    const eName = clamp(name, LIMITS.nombre);
    const eRole = clamp(role, LIMITS.cargo);
    const eBio = clamp(bio, LIMITS.bio);
    if (eName) fieldErrors[`name-${i}`] = eName;
    if (eRole) fieldErrors[`role-${i}`] = eRole;
    if (eBio) fieldErrors[`bio-${i}`] = eBio;

    if (!name && !role && !bio) continue; // fila vacía → se omite

    const file = imagenes[i] as File | undefined;
    const prevPath = rutasPrevias[i] ?? "";
    const upload = await uploadOrKeep(file ?? null, prevPath);
    if (upload.error) return { error: upload.error };

    autoridades.push({
      name,
      role,
      image: upload.path,
      bio: bio || undefined,
    });
  }

  if (autoridades.length < 1) {
    fieldErrors._form = "Agrega al menos una autoridad.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase.from("contenido").upsert(
    { tenant_id: tenantId, clave: "autoridades", valor: autoridades },
    { onConflict: "tenant_id,clave" },
  );
  if (error) {
    return { error: `No se pudo guardar "autoridades": ${error.message}` };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/autoridades");
  return { ok: true };
}
