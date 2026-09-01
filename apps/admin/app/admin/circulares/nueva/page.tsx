import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { CircularForm } from "../circular-form";

export const dynamic = "force-dynamic";

export default async function NuevaCircularPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Nueva circular
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Completa el formulario para publicar una circular en la web.
        </p>
      </div>

      <ModuleCard id="circular-nueva-form" title="Detalles de la circular">
        <CircularForm />
      </ModuleCard>
    </div>
  );
}