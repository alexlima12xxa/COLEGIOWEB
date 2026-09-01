import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { NivelesForm } from "./niveles-form";

export const dynamic = "force-dynamic";

const CLAVES = ["niveles"] as const;

export default async function NivelesPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map((filas ?? []).map((fila) => [fila.clave, fila.valor]));
  const niveles = porClave.get("niveles");

  const nivelesObj =
    niveles && typeof niveles === "object" && !Array.isArray(niveles)
      ? (niveles as Record<string, { description?: string; ageRange?: string; cta?: string }>)
      : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Niveles
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Descripción, edad y llamado a la acción de cada nivel educativo. Los
          cambios aparecen en la web tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="niveles-estado" title="Estado del módulo">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="niveles-editor" title="Niveles educativos">
        <NivelesForm initial={nivelesObj} />
      </ModuleCard>
    </div>
  );
}
