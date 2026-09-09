"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { triggerRebuild } from "@/lib/rebuild";
import {
  PAGINAS_FOOTER,
  REDES_SOCIALES,
} from "./footer-constants";

export type FooterState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const LIMITS = {
  direccion: { min: 5, max: 200 },
  ciudad: { min: 2, max: 120 },
  telefono: { min: 7, max: 40 },
  email: { min: 5, max: 120 },
  horario: { min: 5, max: 200 },
  titulo: { min: 2, max: 60 },
  nivelNombre: { min: 1, max: 80 },
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

interface FooterNivel {
  name: string;
  href: string;
}

export async function guardarFooter(
  _prev: FooterState,
  formData: FormData,
): Promise<FooterState> {
  const fieldErrors: Record<string, string> = {};

  // ── Títulos de las columnas ────────────────────────────────────────────────
  const contactTitle = String(formData.get("contactTitle") ?? "").trim();
  const levelsTitle = String(formData.get("levelsTitle") ?? "").trim();
  const socialTitle = String(formData.get("socialTitle") ?? "").trim();

  const tContact = clamp(contactTitle, LIMITS.titulo);
  const tLevels = clamp(levelsTitle, LIMITS.titulo);
  const tSocial = clamp(socialTitle, LIMITS.titulo);
  if (tContact) fieldErrors.contactTitle = tContact;
  if (tLevels) fieldErrors.levelsTitle = tLevels;
  if (tSocial) fieldErrors.socialTitle = tSocial;

  // ── Contacto ───────────────────────────────────────────────────────────────
  const address = String(formData.get("address") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const officeHours = String(formData.get("officeHours") ?? "").trim();

  const eAddress = clamp(address, LIMITS.direccion);
  const eCity = clamp(city, LIMITS.ciudad);
  const ePhone = clamp(phone, LIMITS.telefono);
  const eEmail = clamp(email, LIMITS.email);
  const eHours = clamp(officeHours, LIMITS.horario);
  if (eAddress) fieldErrors.address = eAddress;
  if (eCity) fieldErrors.city = eCity;
  if (ePhone) fieldErrors.phone = ePhone;
  if (eEmail) fieldErrors.email = eEmail;
  if (eHours) fieldErrors.officeHours = eHours;

  // ── Redes sociales ─────────────────────────────────────────────────────────
  const social: Record<string, string> = {};
  for (const red of REDES_SOCIALES) {
    const url = String(formData.get(`social_${red.clave}`) ?? "").trim();
    if (!url) continue;
    if (!/^https?:\/\/.+/.test(url)) {
      fieldErrors[`social_${red.clave}`] = "Ingresa una URL válida.";
      continue;
    }
    social[red.clave] = url;
  }

  // ── Elementos de nivel ─────────────────────────────────────────────────────
  const levels: FooterNivel[] = [];
  const nivelIndices = new Set<number>();
  for (const key of formData.keys()) {
    const match = /^level_(\d+)_name$/.exec(key);
    if (match) nivelIndices.add(Number(match[1]));
  }
  for (const i of Array.from(nivelIndices).sort((a, b) => a - b)) {
    const name = String(formData.get(`level_${i}_name`) ?? "").trim();
    const href = String(formData.get(`level_${i}_href`) ?? "").trim();
    if (!name && !href) continue;

    const eName = clamp(name, LIMITS.nivelNombre);
    if (eName) fieldErrors[`level_${i}_name`] = eName;
    if (href && !(PAGINAS_FOOTER as readonly string[]).includes(href)) {
      fieldErrors[`level_${i}_href`] = "Elige una página existente.";
    }
    if (name && href) levels.push({ name, href });
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const valor = {
    contact: {
      address: address || undefined,
      city: city || undefined,
      phone: phone || undefined,
      email: email || undefined,
      officeHours: officeHours || undefined,
    },
    contactTitle: contactTitle || undefined,
    levelsTitle: levelsTitle || undefined,
    socialTitle: socialTitle || undefined,
    social,
    levels,
  };

  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase
    .from("contenido")
    .upsert(
      { tenant_id: tenantId, clave: "footer", valor },
      { onConflict: "tenant_id,clave" },
    );
  if (error) {
    return { error: `No se pudo guardar "footer": ${error.message}` };
  }

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/footer");
  return { ok: true };
}