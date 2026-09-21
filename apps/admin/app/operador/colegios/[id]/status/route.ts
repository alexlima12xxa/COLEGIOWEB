import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/operator/supabase-admin";

// GET /operador/colegios/[id]/status
// Estado del job para el polling de la UI. Solo lectura (sin side effects).

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireSuperadmin();
  const { id } = await params;

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("provisioning_jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!job) {
    return NextResponse.json({ ok: false, error: "Job no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    status: job.status,
    currentStep: job.current_step,
    steps: job.steps,
    error: job.error,
    errorCode: job.error_code,
    updatedAt: job.updated_at,
    tenantId: job.tenant_id,
    domain: job.domain,
  });
}
