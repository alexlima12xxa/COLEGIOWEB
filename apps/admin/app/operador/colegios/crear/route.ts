import { waitUntil } from "@vercel/functions";
import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/operator/supabase-admin";
import { preflight } from "@/lib/operator/preflight";
import { runProvisioning } from "@/lib/operator/provision";

// POST /operador/colegios/crear
// Dispara la saga de provisión en background (waitUntil). El preflight valida
// ANTES de insertar el job; la saga se ejecuta idempotente vía runProvisioning.

export const maxDuration = 300;

export async function POST(request: Request) {
  const { user } = await requireSuperadmin();

  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  const domain = typeof body?.domain === "string" ? body.domain.trim() : "";
  const adminEmail =
    typeof body?.adminEmail === "string" ? body.adminEmail.trim() : "";
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "";

  const result = await preflight({ slug, domain, adminEmail, nombre });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, errors: result.errors, warnings: result.warnings },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("provisioning_jobs")
    .insert({
      slug,
      domain,
      admin_email: adminEmail,
      nombre,
      created_by: user.email ?? "",
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !job) {
    return NextResponse.json(
      { ok: false, errors: ["No se pudo crear el job de provisión."] },
      { status: 500 },
    );
  }

  waitUntil(runProvisioning(job.id));

  return NextResponse.json({ ok: true, jobId: job.id }, { status: 202 });
}
