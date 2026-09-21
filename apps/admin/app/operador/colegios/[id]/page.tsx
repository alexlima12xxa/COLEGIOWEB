import { notFound } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/operator/supabase-admin";
import JobPolling from "./job-polling";

export const dynamic = "force-dynamic";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperadmin();
  const { id } = await params;

  const admin = createAdminClient();
  const { data: job } = await admin
    .from("provisioning_jobs")
    .select("slug, domain")
    .eq("id", id)
    .maybeSingle();

  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">
          Alta de colegio: {job.slug}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">{job.domain || "sin dominio"}</p>
      </div>
      <JobPolling jobId={id} />
    </div>
  );
}
