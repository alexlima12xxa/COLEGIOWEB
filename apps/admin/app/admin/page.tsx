import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "./components/module-card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { supabase, user, tenantId } = await requireAdmin();

  // RLS (current_tenant_id + is_admin) aísla la consulta al tenant del usuario:
  // el director ve SOLO su colegio.
  const { data: colegio } = await supabase
    .from("colegios")
    .select("nombre, slug, slogan, descripcion")
    .eq("id", tenantId)
    .maybeSingle();

  const role = user.app_metadata?.role as string | undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Bienvenido al panel
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Sesión iniciada como{" "}
          <span className="font-medium text-zinc-900">{user.email}</span>
        </p>
      </div>

      <ModuleCard id="colegio" title="Tu colegio (tenant)">
        {colegio ? (
          <div>
            <p className="text-lg font-semibold text-zinc-900">
              {colegio.nombre}
            </p>
            {colegio.slogan ? (
              <p className="mt-1 text-sm text-zinc-600">{colegio.slogan}</p>
            ) : null}
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-zinc-50 p-3">
                <dt className="text-zinc-600">Slug</dt>
                <dd className="mt-0.5 font-mono text-xs text-zinc-900">
                  {colegio.slug}
                </dd>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3">
                <dt className="text-zinc-600">Rol</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{role ?? "—"}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">
            No se pudo cargar el colegio (¿existe el tenant en la BD?).
          </p>
        )}
      </ModuleCard>
    </div>
  );
}
