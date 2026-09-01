import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import {
  MisionVisionForm,
  FilosofiaForm,
  HistoriaForm,
} from "./textos-form";

export const dynamic = "force-dynamic";

const CLAVES = ["mision", "vision", "filosofia", "historia", "hero", "video_tour"] as const;

export default async function TextosPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map((filas ?? []).map((fila) => [fila.clave, fila.valor]));

  const mision = porClave.get("mision");
  const vision = porClave.get("vision");
  const filosofia = porClave.get("filosofia");
  const historia = porClave.get("historia");

  const filosofiaItems = Array.isArray(filosofia)
    ? (filosofia as { title?: string; description?: string }[])
    : [];
  const historiaItems = Array.isArray(historia)
    ? (historia as { title?: string; date?: string; description?: string }[])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Textos
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Contenido editorial del sitio: misión, visión, filosofía e historia.
          Los cambios aparecen en la web tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="textos-estado" title="Estado de las claves">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="textos-mision" title="Misión y visión">
        <MisionVisionForm
          initial={{
            mision: typeof mision === "string" ? mision : undefined,
            vision: typeof vision === "string" ? vision : undefined,
          }}
        />
      </ModuleCard>

      <ModuleCard id="textos-filosofia" title="Filosofía">
        <FilosofiaForm initial={filosofiaItems} />
      </ModuleCard>

      <ModuleCard id="textos-historia" title="Historia">
        <HistoriaForm initial={historiaItems} />
      </ModuleCard>
    </div>
  );
}
