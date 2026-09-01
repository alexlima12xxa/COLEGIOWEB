import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { GaleriaForm } from "./galeria-form";

export const dynamic = "force-dynamic";

const CLAVES = ["galeria"] as const;

export default async function GaleriaPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map((filas ?? []).map((fila) => [fila.clave, fila.valor]));
  const galeria = porClave.get("galeria");

  const galeriaItems = Array.isArray(galeria)
    ? (galeria as { src?: string; alt?: string; title?: string; category?: string; order?: number }[])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Galería
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Imágenes de la galería del sitio. Los cambios aparecen en la web tras
          el rebuild automático.
        </p>
      </div>

      <ModuleCard id="galeria-estado" title="Estado del módulo">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="galeria-editor" title="Imágenes">
        <GaleriaForm initial={galeriaItems} />
      </ModuleCard>
    </div>
  );
}
