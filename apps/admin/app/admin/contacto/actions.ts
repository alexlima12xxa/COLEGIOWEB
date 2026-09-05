"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { triggerRebuild } from "@/lib/rebuild";

export type ContactoState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const LIMITS = {
  direccion: { min: 5, max: 200 },
  telefono: { min: 7, max: 40 },
  email: { min: 5, max: 120 },
  horario: { min: 5, max: 200 },
  mapa: { min: 0, max: 500 },
  deptNombre: { min: 2, max: 120 },
  deptTelefono: { min: 7, max: 40 },
  deptEmail: { min: 5, max: 120 },
  deptHorario: { min: 0, max: 200 },
} as const;

function clamp(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

interface Departamento {
  name: string;
  phone: string;
  email: string;
  hours?: string;
  hidden?: boolean;
}

export async function guardarContacto(
  _prev: ContactoState,
  formData: FormData,
): Promise<ContactoState> {
  const fieldErrors: Record<string, string> = {};

  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const hours = String(formData.get("hours") ?? "").trim();
  const mapUrl = String(formData.get("mapUrl") ?? "").trim();
  const mapEmbedUrl = String(formData.get("mapEmbedUrl") ?? "").trim();

  const eAddress = clamp(address, LIMITS.direccion);
  const ePhone = clamp(phone, LIMITS.telefono);
  const eEmail = clamp(email, LIMITS.email);
  const eHours = clamp(hours, LIMITS.horario);
  const eMap = clamp(mapUrl, LIMITS.mapa);
  const eMapEmbed = clamp(mapEmbedUrl, LIMITS.mapa);
  if (eAddress) fieldErrors.address = eAddress;
  if (ePhone) fieldErrors.phone = ePhone;
  if (eEmail) fieldErrors.email = eEmail;
  if (eHours) fieldErrors.hours = eHours;
  if (eMap) fieldErrors.mapUrl = eMap;
  if (eMapEmbed) fieldErrors.mapEmbedUrl = eMapEmbed;

  // Directorio de departamentos
  const deptNombres = formData.getAll("dept_name");
  const deptTelefonos = formData.getAll("dept_phone");
  const deptEmails = formData.getAll("dept_email");
  const deptHorarios = formData.getAll("dept_hours");
  const departments: Departamento[] = [];
  const deptCount = Math.max(
    deptNombres.length,
    deptTelefonos.length,
    deptEmails.length,
    deptHorarios.length,
  );
  for (let i = 0; i < deptCount; i++) {
    const name = String(deptNombres[i] ?? "").trim();
    const deptPhone = String(deptTelefonos[i] ?? "").trim();
    const deptEmail = String(deptEmails[i] ?? "").trim();
    const deptHours = String(deptHorarios[i] ?? "").trim();
    if (!name && !deptPhone && !deptEmail && !deptHours) continue;
    const eN = clamp(name, LIMITS.deptNombre);
    const eP = clamp(deptPhone, LIMITS.deptTelefono);
    const eE = clamp(deptEmail, LIMITS.deptEmail);
    const eH = clamp(deptHours, LIMITS.deptHorario);
    if (eN) fieldErrors[`dept_name-${i}`] = eN;
    if (eP) fieldErrors[`dept_phone-${i}`] = eP;
    if (eE) fieldErrors[`dept_email-${i}`] = eE;
    if (eH) fieldErrors[`dept_hours-${i}`] = eH;
    departments.push({
      name,
      phone: deptPhone,
      email: deptEmail,
      hours: deptHours || undefined,
      hidden: formData.get(`dept_hidden-${i}`) === "on",
    });
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const valor = {
    info: {
      address: address || undefined,
      phone: phone || undefined,
      email: email || undefined,
      hours: hours || undefined,
      mapUrl: mapUrl || undefined,
      mapEmbedUrl: mapEmbedUrl || undefined,
    },
    departments,
  };

  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase.from("contenido").upsert(
    { tenant_id: tenantId, clave: "contacto", valor },
    { onConflict: "tenant_id,clave" },
  );
  if (error) {
    return { error: `No se pudo guardar "contacto": ${error.message}` };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/contacto");
  return { ok: true };
}
