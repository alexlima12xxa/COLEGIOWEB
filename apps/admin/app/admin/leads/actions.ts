"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ESTADOS, ESTADO_SIGUIENTE, type LeadEstado } from "./leads-constants";

// Avanza el estado de un lead en la secuencia nuevo → contactado → cerrado.
// requireAdmin() garantiza sesión de admin + tenant; RLS aísla la fila al
// tenant del director (leads_update_admin), así que un lead de otro tenant
// no se puede modificar.
export async function cambiarEstadoLead(formData: FormData) {
  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const estado = String(formData.get("estado") ?? "") as LeadEstado;

  if (!id || !ESTADOS.includes(estado)) return;

  const siguiente = ESTADO_SIGUIENTE[estado];
  if (!siguiente) return; // "cerrado" no avanza más

  const { error } = await supabase
    .from("leads")
    .update({ estado: siguiente })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar el estado del lead: ${error.message}`);
  }

  revalidatePath("/admin/leads");
}
