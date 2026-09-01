import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { AutoridadesForm } from "./autoridades-form";

export const dynamic = "force-dynamic";

const CLAVES = ["autoridades"] as const;

export default async function AutoridadesPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map((filas ?? []).map((fila) => [fila.clave, fila.valor]));
  const autoridades = porClave.get("autoridades");

  const autoridadesItems = Array.isArray(autoridades)
    ? (autoridades as { name?: string; role?: string; image?: string; bio?: string }[])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Autoridades
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Directivos y autoridades del colegio. Los cambios aparecen en la web
          tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="autoridades-estado" title="Estado del módulo">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="autoridades-editor" title="Directivos">
        <AutoridadesForm initial={autoridadesItems} />
      </ModuleCard>
    </div>
  );
}
