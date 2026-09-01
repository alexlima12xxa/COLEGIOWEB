import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { LeadsFilters } from "./leads-filters";
import { LeadsTable } from "./leads-table";
import { ESTADOS, NIVELES, type LeadEstado } from "./leads-constants";

export const dynamic = "force-dynamic";

interface LeadsPageProps {
  searchParams: Promise<{
    estado?: string;
    nivel?: string;
    desde?: string;
    hasta?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;

  const estado = ESTADOS.includes(params.estado as LeadEstado)
    ? (params.estado as LeadEstado)
    : undefined;
  const nivel = NIVELES.includes(params.nivel as (typeof NIVELES)[number])
    ? params.nivel
    : undefined;
  const desde = params.desde || undefined;
  const hasta = params.hasta || undefined;

  let query = supabase
    .from("leads")
    .select(
      "id, nombre, email, telefono, nivel_interes, mensaje, estado, created_at",
    )
    .order("created_at", { ascending: false });

  if (estado) query = query.eq("estado", estado);
  if (nivel) query = query.eq("nivel_interes", nivel);
  if (desde) query = query.gte("created_at", `${desde}T00:00:00`);
  if (hasta) query = query.lte("created_at", `${hasta}T23:59:59`);

  const { data: leads, error } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Leads
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Solicitudes de información recibidas desde el formulario de
          admisiones de la web.
        </p>
      </div>

      <ModuleCard id="leads-filtros" title="Filtros">
        <LeadsFilters
          estado={estado}
          nivel={nivel}
          desde={desde}
          hasta={hasta}
        />
      </ModuleCard>

      <ModuleCard id="leads-listado" title="Listado">
        {error ? (
          <p className="text-sm text-red-700">No se pudo leer el módulo.</p>
        ) : leads && leads.length > 0 ? (
          <LeadsTable leads={leads} />
        ) : (
          <p className="text-sm text-zinc-600">
            No hay leads que coincidan con los filtros seleccionados.
          </p>
        )}
      </ModuleCard>
    </div>
  );
}
