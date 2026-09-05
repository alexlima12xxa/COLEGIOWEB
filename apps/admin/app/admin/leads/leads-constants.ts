// Constantes y tipos compartidos del módulo de Leads.
// Este archivo NO depende de next/headers ni de ningún módulo de servidor,
// por lo que puede importarse desde Server Components y Client Components
// sin arrastrar código de servidor al bundle del cliente.

export const ESTADOS = ["nuevo", "contactado", "cerrado"] as const;
export type LeadEstado = (typeof ESTADOS)[number];

export const NIVELES = [
  "Preescolar",
  "Primaria",
  "Secundaria",
] as const;

export const ESTADO_LABEL: Record<LeadEstado, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  cerrado: "Cerrado",
};

export const ESTADO_BADGE: Record<LeadEstado, string> = {
  nuevo: "bg-blue-50 text-blue-700",
  contactado: "bg-amber-50 text-amber-700",
  cerrado: "bg-zinc-100 text-zinc-600",
};

// Secuencia de avance del estado: nuevo → contactado → cerrado.
export const ESTADO_SIGUIENTE: Record<LeadEstado, LeadEstado | null> = {
  nuevo: "contactado",
  contactado: "cerrado",
  cerrado: null,
};
