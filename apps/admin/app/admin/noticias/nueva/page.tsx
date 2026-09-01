import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { NoticiaForm } from "../noticia-form";

export const dynamic = "force-dynamic";

export default async function NuevaNoticiaPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Nueva noticia
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Completa el formulario para publicar una noticia en la web.
        </p>
      </div>

      <ModuleCard id="noticia-nueva-form" title="Detalles de la noticia">
        <NoticiaForm />
      </ModuleCard>
    </div>
  );
}