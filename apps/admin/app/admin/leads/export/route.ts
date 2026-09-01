import { requireAdmin } from "@/lib/auth";
import { ESTADOS, NIVELES, type LeadEstado } from "../leads-constants";

export const dynamic = "force-dynamic";

interface ExportSearchParams {
  estado?: string;
  nivel?: string;
  desde?: string;
  hasta?: string;
}

// Escapa un valor para CSV (RFC 4180): envuelve en comillas si contiene
// comas, comillas, saltos de línea o punto y coma.
function csvCell(value: string | null | undefined): string {
  const v = value ?? "";
  if (/[",;\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function GET(request: Request) {
  const { supabase } = await requireAdmin();

  const url = new URL(request.url);
  const params: ExportSearchParams = {
    estado: url.searchParams.get("estado") ?? undefined,
    nivel: url.searchParams.get("nivel") ?? undefined,
    desde: url.searchParams.get("desde") ?? undefined,
    hasta: url.searchParams.get("hasta") ?? undefined,
  };

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

  if (error) {
    return new Response("No se pudo exportar los leads.", { status: 500 });
  }

  const header = [
    "Nombre",
    "Email",
    "Teléfono",
    "Nivel de interés",
    "Mensaje",
    "Estado",
    "Fecha",
  ];

  const rows = (leads ?? []).map((lead) => [
    csvCell(lead.nombre),
    csvCell(lead.email),
    csvCell(lead.telefono),
    csvCell(lead.nivel_interes),
    csvCell(lead.mensaje),
    csvCell(lead.estado),
    csvCell(
      new Date(lead.created_at).toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    ),
  ]);

  // BOM UTF-8 para que Excel detecte la codificación correctamente.
  const csv = "\uFEFF" + [header, ...rows].map((r) => r.join(",")).join("\r\n");

  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
