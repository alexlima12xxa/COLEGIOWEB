import { ESTADO_BADGE, ESTADO_LABEL, type LeadEstado } from "./leads-constants";
import { LeadEstadoButton } from "./lead-estado-button";

export interface LeadRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  nivel_interes: string | null;
  mensaje: string | null;
  estado: string;
  created_at: string;
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
            <th className="py-2 pr-4 font-medium">Nombre</th>
            <th className="py-2 pr-4 font-medium">Contacto</th>
            <th className="py-2 pr-4 font-medium">Nivel</th>
            <th className="py-2 pr-4 font-medium">Estado</th>
            <th className="py-2 pr-4 font-medium">Fecha</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {leads.map((lead) => (
            <tr key={lead.id} className="align-top">
              <td className="py-3 pr-4">
                <p className="font-semibold text-zinc-900">{lead.nombre}</p>
                {lead.mensaje ? (
                  <p className="mt-0.5 line-clamp-2 max-w-xs text-xs text-zinc-500">
                    {lead.mensaje}
                  </p>
                ) : null}
              </td>
              <td className="py-3 pr-4">
                <p className="text-zinc-700">{lead.email}</p>
                {lead.telefono ? (
                  <p className="mt-0.5 text-xs text-zinc-500">{lead.telefono}</p>
                ) : null}
              </td>
              <td className="py-3 pr-4 text-zinc-700">
                {lead.nivel_interes ?? "—"}
              </td>
              <td className="py-3 pr-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    ESTADO_BADGE[lead.estado as LeadEstado] ??
                    "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {ESTADO_LABEL[lead.estado as LeadEstado] ?? lead.estado}
                </span>
              </td>
              <td className="py-3 pr-4 text-zinc-700">
                {new Date(lead.created_at).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="py-3 text-right">
                <LeadEstadoButton id={lead.id} estado={lead.estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
