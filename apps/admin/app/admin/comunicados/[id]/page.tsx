import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { CircularForm } from "../circular-form";

export const dynamic = "force-dynamic";

export default async function EditarCircularPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const { data: circular, error } = await supabase
    .from("circulares")
    .select(
      "id, titulo, descripcion, categoria, fecha, archivo_path, archivo_nombre, publicado, publicado_en, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !circular) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Editar comunicado
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Actualiza los detalles del comunicado. Los cambios se verán en la web
          tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="circular-editar-form" title="Detalles del comunicado">
        <CircularForm circular={circular} />
      </ModuleCard>
    </div>
  );
}