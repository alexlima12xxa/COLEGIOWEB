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
  periodo: { min: 0, max: 160 },
  fechaTitulo: { min: 3, max: 120 },
  fechaFecha: { min: 1, max: 80 },
  fechaDesc: { min: 0, max: 500 },
  aviso: { min: 0, max: 500 },
  etapaTitulo: { min: 3, max: 120 },
  etapaDesc: { min: 3, max: 500 },
  etapaPie: { min: 2, max: 120 },
  requisitoTitulo: { min: 2, max: 160 },
  requisitoDesc: { min: 3, max: 500 },
  requisitoFormato: { min: 2, max: 120 },
  faqTitulo: { min: 3, max: 200 },
  faqContenido: { min: 3, max: 1000 },
} as const;

const ESTADOS = ["en-curso", "ultimos-cupos", "familias-admitidas"] as const;

function clamp(value: string, limits: { min: number; max: number }): string | null {
  const len = value.length;
  if (len < limits.min) return `Mínimo ${limits.min} caracteres (actual: ${len}).`;
  if (len > limits.max) return `Máximo ${limits.max} caracteres (actual: ${len}).`;
  return null;
}

interface FechaClaveItem {
  title: string;
  date: string;
  estado: (typeof ESTADOS)[number];
  description?: string;
}

interface EtapaItem {
  title: string;
  description: string;
  pie: string;
}

interface RequisitoItem {
  title: string;
  description: string;
  formato: string;
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

  const aviso = String(formData.get("aviso") ?? "").trim();
  const eAviso = clamp(aviso, LIMITS.aviso);
  if (eAviso) fieldErrors.aviso = eAviso;

  // Fechas clave (lista de {title, date, estado, description})
  const fechaTitulos = formData.getAll("fecha_title");
  const fechaFechas = formData.getAll("fecha_date");
  const fechaEstados = formData.getAll("fecha_estado");
  const fechaDescs = formData.getAll("fecha_description");
  const fechasClave: FechaClaveItem[] = [];
  const fechaCount = Math.max(
    fechaTitulos.length,
    fechaFechas.length,
    fechaEstados.length,
    fechaDescs.length,
  );
  for (let i = 0; i < fechaCount; i++) {
    const title = String(fechaTitulos[i] ?? "").trim();
    const date = String(fechaFechas[i] ?? "").trim();
    const estadoRaw = String(fechaEstados[i] ?? "en-curso");
    const estado = (ESTADOS as readonly string[]).includes(estadoRaw)
      ? (estadoRaw as (typeof ESTADOS)[number])
      : "en-curso";
    const description = String(fechaDescs[i] ?? "").trim();
    if (!title && !date && !description) continue;
    const eT = clamp(title, LIMITS.fechaTitulo);
    const eF = clamp(date, LIMITS.fechaFecha);
    const eD = clamp(description, LIMITS.fechaDesc);
    if (eT) fieldErrors[`fecha_title-${i}`] = eT;
    if (eF) fieldErrors[`fecha_date-${i}`] = eF;
    if (eD) fieldErrors[`fecha_description-${i}`] = eD;
    fechasClave.push({ title, date, estado, description: description || undefined });
  }

  // Etapas (lista de {title, description, pie})
  const etapaTitulos = formData.getAll("etapa_title");
  const etapaDescs = formData.getAll("etapa_description");
  const etapaPies = formData.getAll("etapa_pie");
  const etapas: EtapaItem[] = [];
  const etapaCount = Math.max(etapaTitulos.length, etapaDescs.length, etapaPies.length);
  for (let i = 0; i < etapaCount; i++) {
    const title = String(etapaTitulos[i] ?? "").trim();
    const description = String(etapaDescs[i] ?? "").trim();
    const pie = String(etapaPies[i] ?? "").trim();
    if (!title && !description && !pie) continue;
    const eT = clamp(title, LIMITS.etapaTitulo);
    const eD = clamp(description, LIMITS.etapaDesc);
    const eP = clamp(pie, LIMITS.etapaPie);
    if (eT) fieldErrors[`etapa_title-${i}`] = eT;
    if (eD) fieldErrors[`etapa_description-${i}`] = eD;
    if (eP) fieldErrors[`etapa_pie-${i}`] = eP;
    etapas.push({ title, description, pie });
  }

  // Requisitos por nivel (objeto { [nivel]: [{title, description, formato}] })
  const NIVELES = ["preescolar", "primaria", "secundaria"] as const;
  const requisitosPorNivel: Record<string, RequisitoItem[]> = {};
  for (const nivel of NIVELES) {
    const titulos = formData.getAll(`req_${nivel}_title`);
    const descs = formData.getAll(`req_${nivel}_desc`);
    const formatos = formData.getAll(`req_${nivel}_formato`);
    const reqs: RequisitoItem[] = [];
    const count = Math.max(titulos.length, descs.length, formatos.length);
    for (let i = 0; i < count; i++) {
      const title = String(titulos[i] ?? "").trim();
      const description = String(descs[i] ?? "").trim();
      const formato = String(formatos[i] ?? "").trim();
      if (!title && !description && !formato) continue;
      const eT = clamp(title, LIMITS.requisitoTitulo);
      const eD = clamp(description, LIMITS.requisitoDesc);
      const eF = clamp(formato, LIMITS.requisitoFormato);
      if (eT) fieldErrors[`req_${nivel}_title-${i}`] = eT;
      if (eD) fieldErrors[`req_${nivel}_desc-${i}`] = eD;
      if (eF) fieldErrors[`req_${nivel}_formato-${i}`] = eF;
      reqs.push({ title, description, formato });
    }
    requisitosPorNivel[nivel] = reqs;
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
    fechasClave,
    aviso: aviso || undefined,
    etapas,
    requisitosPorNivel,
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

  await triggerRebuild(supabase, tenantId);
  revalidatePath("/admin/admisiones");
  return { ok: true };
}