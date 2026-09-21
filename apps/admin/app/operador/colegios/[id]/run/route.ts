import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth";
import { runProvisioning } from "@/lib/operator/provision";

// POST /operador/colegios/[id]/run
// Reanuda la saga de un job existente (pending/failed/running-stale). El claim
// atómico de runProvisioning garantiza un solo worker; si el job ya terminó o
// está activo, no hace nada. Lo usan el botón Reintentar y el polling de la UI.

export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireSuperadmin();
  const { id } = await params;

  waitUntil(runProvisioning(id));

  return NextResponse.json({ ok: true }, { status: 202 });
}
