import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Defensa en profundidad: además del proxy, validamos la sesión aquí.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // El tenant y el rol vienen en app_metadata (fijados por Supabase, no
  // editables por el usuario final). Es la fuente de autorización de RLS.
  const tenantId = user.app_metadata?.tenant_id as string | undefined;
  const role = user.app_metadata?.role as string | undefined;

  // Consulta el colegio del usuario. RLS (current_tenant_id) garantiza que
  // solo vea SU tenant, nunca otro.
  let colegio: { nombre: string; slug: string } | null = null;
  if (tenantId) {
    const { data } = await supabase
      .from("colegios")
      .select("nombre, slug")
      .eq("id", tenantId)
      .maybeSingle();
    colegio = data;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Bienvenido al panel
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Sesión iniciada como <span className="font-medium">{user.email}</span>
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Tu colegio (tenant)
        </h2>
        {colegio ? (
          <div className="mt-3">
            <p className="text-lg font-semibold text-zinc-900">
              {colegio.nombre}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Slug: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{colegio.slug}</code>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-600">
            {tenantId
              ? "No se pudo cargar el colegio (¿existe el tenant en la BD?)."
              : "El usuario no tiene tenant asignado (app_metadata.tenant_id vacío)."}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Datos de sesión
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-zinc-50 p-3">
            <dt className="text-zinc-500">Tenant ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-zinc-800">
              {tenantId ?? "—"}
            </dd>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3">
            <dt className="text-zinc-500">Rol</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">
              {role ?? "—"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
