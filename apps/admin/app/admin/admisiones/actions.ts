"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { triggerRebuild } from "@/lib/rebuild";

export type AdmisionesState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const LIMITS = {
  periodo: { min: 0, max: 120 },
  requisito: { min: 3, max: 300 },
  cronoTitulo: { min: 3, max: 120 },
  cronoFecha: { min: 1, max: 60 },
  cronoDesc: { min: 0, max: 500 },
  faqTitulo: { min: 3, max: 200 },
  faqContenido: { min: 3, max: 1000 },
} as const;

function clamp(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

interface CronogramaItem {
  title: string;
  date: string;
  description?: string;
}

interface FaqItem {
  id: string;
  title: string;
  content: string;
}

export async function guardarAdmisiones(
  _prev: AdmisionesState,
  formData: FormData,
): Promise<AdmisionesState> {
  const fieldErrors: Record<string, string> = {};

  const periodLabel = String(formData.get("periodLabel") ?? "").trim();
  const ePeriodo = clamp(periodLabel, LIMITS.periodo);
  if (ePeriodo) fieldErrors.periodLabel = ePeriodo;

  // Requisitos (lista de strings)
  const requisitosRaw = formData.getAll("requisito");
  const requirements: string[] = [];
  requisitosRaw.forEach((raw, i) => {
    const value = String(raw).trim();
    if (!value) return;
    const e = clamp(value, LIMITS.requisito);
    if (e) fieldErrors[`requisito-${i}`] = e;
    requirements.push(value);
  });

  // Cronograma (lista de {title, date, description})
  const cronoTitulos = formData.getAll("crono_title");
  const cronoFechas = formData.getAll("crono_date");
  const cronoDescs = formData.getAll("crono_description");
  const schedule: CronogramaItem[] = [];
  const cronoCount = Math.max(cronoTitulos.length, cronoFechas.length, cronoDescs.length);
  for (let i = 0; i < cronoCount; i++) {
    const title = String(cronoTitulos[i] ?? "").trim();
    const date = String(cronoFechas[i] ?? "").trim();
    const description = String(cronoDescs[i] ?? "").trim();
    if (!title && !date && !description) continue;
    const eT = clamp(title, LIMITS.cronoTitulo);
    const eF = clamp(date, LIMITS.cronoFecha);
    const eD = clamp(description, LIMITS.cronoDesc);
    if (eT) fieldErrors[`crono_title-${i}`] = eT;
    if (eF) fieldErrors[`crono_date-${i}`] = eF;
    if (eD) fieldErrors[`crono_description-${i}`] = eD;
    schedule.push({ title, date, description: description || undefined });
  }

  // FAQ (lista de {title, content})
  const faqTitulos = formData.getAll("faq_title");
  const faqContenidos = formData.getAll("faq_content");
  const faq: FaqItem[] = [];
  const faqCount = Math.max(faqTitulos.length, faqContenidos.length);
  for (let i = 0; i < faqCount; i++) {
    const title = String(faqTitulos[i] ?? "").trim();
    const content = String(faqContenidos[i] ?? "").trim();
    if (!title && !content) continue;
    const eT = clamp(title, LIMITS.faqTitulo);
    const eC = clamp(content, LIMITS.faqContenido);
    if (eT) fieldErrors[`faq_title-${i}`] = eT;
    if (eC) fieldErrors[`faq_content-${i}`] = eC;
    faq.push({ id: `faq-${i}`, title, content });
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const valor = {
    periodLabel: periodLabel || undefined,
    requirements,
    schedule,
    faq,
  };

  const { supabase, tenantId } = await requireAdmin();
  const { error } = await supabase.from("contenido").upsert(
    { tenant_id: tenantId, clave: "admisiones", valor },
    { onConflict: "tenant_id,clave" },
  );
  if (error) {
    return { error: `No se pudo guardar "admisiones": ${error.message}` };
  }

  await triggerRebuild();
  revalidatePath("/admin/admisiones");
  return { ok: true };
}
