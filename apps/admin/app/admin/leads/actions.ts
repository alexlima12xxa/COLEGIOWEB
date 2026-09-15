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

// Elimina uno o varios leads por su id (borrado individual, grupal o total).
// requireAdmin() garantiza sesión + tenant, y RLS (leads_delete_admin) aísla
// el borrado al colegio del director: los ids de otro tenant no se eliminan.
export async function eliminarLeads(ids: string[]) {
  const { supabase } = await requireAdmin();

  const validos = Array.from(
    new Set(ids.filter((id) => typeof id === "string" && id.length > 0)),
  );

  if (validos.length === 0) return;

  const { error } = await supabase.from("leads").delete().in("id", validos);

  if (error) {
    throw new Error(`No se pudieron eliminar los leads: ${error.message}`);
  }

  revalidatePath("/admin/leads");
}
