import { requireSuperadmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/operator/supabase-admin";
import ColegiosForm from "./colegios-form";

export const dynamic = "force-dynamic";

export default async function ColegiosPage() {
  await requireSuperadmin();

  const admin = createAdminClient();
  const { data: colegios } = await admin
    .from("colegios")
    .select("id, slug, nombre, domain, activo, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-xl font-semibold text-zinc-900">Colegios</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tenants registrados en la base de datos (multi-colegio).
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Dominio</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(colegios ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-zinc-800">{c.slug}</td>
                  <td className="px-4 py-3 text-zinc-700">{c.nombre}</td>
                  <td className="px-4 py-3 text-zinc-600">{c.domain || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={c.activo ? "text-emerald-700" : "text-amber-700"}>
                      {c.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))}
              {(colegios ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-zinc-500">
                    Sin colegios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">Alta de un colegio</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Contrato de dos fases: la fase código (config + branding + clients.json)
          debe estar mergeada y desplegada antes de provisionar.
        </p>
        <div className="mt-4">
          <ColegiosForm />
        </div>
      </section>
    </div>
  );
}
