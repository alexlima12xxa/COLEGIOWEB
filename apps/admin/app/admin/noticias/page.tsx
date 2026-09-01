import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { mediaUrl } from "@/lib/storage";
import { DeleteNoticiaButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const { supabase } = await requireAdmin();

  const { data: noticias, error } = await supabase
    .from("noticias")
    .select("id, slug, titulo, resumen, imagen_path, autor, publicado, publicado_en")
    .order("publicado_en", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Noticias
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Publica y gestiona las noticias del colegio. Se publican en la web
            tras el rebuild automático.
          </p>
        </div>
        <Link
          href="/admin/noticias/nueva"
          className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          Nueva noticia
        </Link>
      </div>

      <ModuleCard id="noticias-listado" title="Listado">
        {error ? (
          <p className="text-sm text-red-700">No se pudo leer el módulo.</p>
        ) : noticias && noticias.length > 0 ? (
          <ul className="divide-y divide-zinc-200">
            {noticias.map((noticia) => (
              <li
                key={noticia.id}
                className="flex flex-wrap items-center gap-4 py-4 first:pt-0 last:pb-0"
              >
                {noticia.imagen_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(noticia.imagen_path)}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded-lg object-cover ring-1 ring-zinc-200"
                  />
                ) : (
                  <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs text-zinc-500 ring-1 ring-zinc-200">
                    Sin foto
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {noticia.titulo}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {noticia.autor ? `${noticia.autor} · ` : ""}
                    {new Date(noticia.publicado_en).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    <span className="ml-2 font-mono text-zinc-400">/{noticia.slug}</span>
                  </p>
                </div>

                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    noticia.publicado
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {noticia.publicado ? "Publicada" : "Borrador"}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/noticias/${noticia.id}`}
                    className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                  >
                    Editar
                  </Link>
                  <DeleteNoticiaButton id={noticia.id} titulo={noticia.titulo} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600">
            Aún no hay noticias. Crea la primera con “Nueva noticia”.
          </p>
        )}
      </ModuleCard>
    </div>
  );
}