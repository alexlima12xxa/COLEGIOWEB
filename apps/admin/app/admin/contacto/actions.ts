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
  mapa: { min: 0, max: 500 },
  deptNombre: { min: 2, max: 120 },
  deptTelefono: { min: 7, max: 40 },
  deptEmail: { min: 5, max: 120 },
  deptHorario: { min: 0, max: 200 },
} as const;

const WHATSAPP_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const mapUrl = String(formData.get("mapUrl") ?? "").trim();
  const mapEmbedUrl = String(formData.get("mapEmbedUrl") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp") ?? "").trim();
  const emailNotificaciones = String(
    formData.get("emailNotificaciones") ?? "",
  ).trim();

  const eMap = clamp(mapUrl, LIMITS.mapa);
  const eMapEmbed = clamp(mapEmbedUrl, LIMITS.mapa);
  if (eMap) fieldErrors.mapUrl = eMap;
  if (eMapEmbed) fieldErrors.mapEmbedUrl = eMapEmbed;

  if (!WHATSAPP_REGEX.test(whatsapp)) {
    fieldErrors.whatsapp =
      'El número debe comenzar con "+" seguido de 7 a 15 dígitos (sin espacios ni guiones).';
  }

  if (emailNotificaciones && !EMAIL_REGEX.test(emailNotificaciones)) {
    fieldErrors.emailNotificaciones = "Ingresa un correo electrónico válido.";
  }

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

  const { supabase, tenantId } = await requireAdmin();

  // `formFields` no se edita en el panel (los define la web en su fallback).
  // Se preservan desde la fila existente para no borrarlos al guardar.
  const { data: filaExistente } = await supabase
    .from("contenido")
    .select("valor")
    .eq("tenant_id", tenantId)
    .eq("clave", "contacto")
    .maybeSingle();
  const formFields = Array.isArray(
    (filaExistente?.valor as { formFields?: unknown } | null)?.formFields,
  )
    ? (filaExistente?.valor as { formFields: unknown[] }).formFields
    : undefined;

  // La clave `contacto` solo guarda lo específico de la página de contacto:
  // URLs del mapa y directorio por departamento. Los datos generales de
  // contacto (dirección, teléfono, email, horario) se guardan en la clave
  // `footer` (pestaña "Footer").
  const valor = {
    info: {
      mapUrl: mapUrl || undefined,
      mapEmbedUrl: mapEmbedUrl || undefined,
    },
    departments,
    ...(formFields ? { formFields } : {}),
  };

  const { error } = await supabase
    .from("contenido")
    .upsert(
      { tenant_id: tenantId, clave: "contacto", valor },
      { onConflict: "tenant_id,clave" },
    );
  if (error) {
    return { error: `No se pudo guardar "contacto": ${error.message}` };
  }

  // WhatsApp se guarda como clave propia (`whatsapp`): la web lo consume con
  // getWhatsapp() con fallback a siteConfig.contact.whatsapp.
  const { error: errorWhatsapp } = await supabase
    .from("contenido")
    .upsert(
      { tenant_id: tenantId, clave: "whatsapp", valor: { numero: whatsapp } },
      { onConflict: "tenant_id,clave" },
    );
  if (errorWhatsapp) {
    return { error: `No se pudo guardar "whatsapp": ${errorWhatsapp.message}` };
  }

  // Correo de notificaciones de leads. Se guarda como clave `notificaciones`
  // (mismo patrón que `whatsapp`): la Edge Function send-lead-email lo lee
  // para resolver el destino de los correos de solicitud.
  const { error: errorNotificaciones } = await supabase
    .from("contenido")
    .upsert(
      {
        tenant_id: tenantId,
        clave: "notificaciones",
        valor: { email: emailNotificaciones || null },
      },
      { onConflict: "tenant_id,clave" },
    );
  if (errorNotificaciones) {
    return {
      error: `No se pudo guardar "notificaciones": ${errorNotificaciones.message}`,
    };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/contacto");
  return { ok: true };
}
