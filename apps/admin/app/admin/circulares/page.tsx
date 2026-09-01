import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { DeleteCircularButton } from "./delete-button";

export const dynamic = "force-dynamic";

const CATEGORIAS: Record<string, string> = {
  academica: "Académica",
  administrativa: "Administrativa",
  general: "General",
};

export default async function CircularesPage() {
  const { supabase } = await requireAdmin();

  const { data: circulares, error } = await supabase
    .from("circulares")
    .select("id, titulo, descripcion, categoria, fecha, archivo_path, publicado, publicado_en")
    .order("fecha", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Circulares
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Publica circulares y documentos del colegio. Aparecen en la web tras
            el rebuild automático.
          </p>
        </div>
        <Link
          href="/admin/circulares/nueva"
          className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          Nueva circular
        </Link>
      </div>

      <ModuleCard id="circulares-listado" title="Listado">
        {error ? (
          <p className="text-sm text-red-700">No se pudo leer el módulo.</p>
        ) : circulares && circulares.length > 0 ? (
          <ul className="divide-y divide-zinc-200">
            {circulares.map((circular) => (
              <li
                key={circular.id}
                className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs text-zinc-500 ring-1 ring-zinc-200">
                  {circular.archivo_path ? "PDF" : "Sin PDF"}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {circular.titulo}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {new Date(circular.fecha).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {circular.categoria
                      ? ` · ${CATEGORIAS[circular.categoria.toLowerCase()] ?? circular.categoria}`
                      : ""}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    circular.publicado
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {circular.publicado ? "Publicada" : "Borrador"}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/circulares/${circular.id}`}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Editar
                  </Link>
                  <DeleteCircularButton id={circular.id} titulo={circular.titulo} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600">
            Aún no hay circulares. Crea la primera con “Nueva circular”.
          </p>
        )}
      </ModuleCard>
    </div>
  );
}