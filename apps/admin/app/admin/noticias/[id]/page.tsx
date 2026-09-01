import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { NoticiaForm } from "../noticia-form";

export const dynamic = "force-dynamic";

export default async function EditarNoticiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const { data: noticia, error } = await supabase
    .from("noticias")
    .select(
      "id, slug, titulo, resumen, contenido, imagen_path, imagen_alt, autor, publicado, publicado_en, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !noticia) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Editar noticia
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Actualiza los detalles de la noticia. Los cambios se verán en la web
          tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="noticia-editar-form" title="Detalles de la noticia">
        <NoticiaForm noticia={noticia} />
      </ModuleCard>
    </div>
  );
}