import { requireAdmin } from "@/lib/auth";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { CollapsibleCard } from "@/app/admin/components/collapsible-card";
import {
  MisionVisionForm,
  FilosofiaForm,
  HistoriaForm,
  NosotrosHeroForm,
} from "./textos-form";

export const dynamic = "force-dynamic";

const CLAVES = ["mision", "vision", "filosofia", "historia", "nosotros_hero"] as const;

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
  const nosotrosHero = porClave.get("nosotros_hero");

  const filosofiaItems = Array.isArray(filosofia)
    ? (filosofia as { title?: string; description?: string }[])
    : [];
  const historiaItems = Array.isArray(historia)
    ? (historia as { title?: string; date?: string; description?: string }[])
    : [];

  const nosotrosHeroObj =
    nosotrosHero && typeof nosotrosHero === "object" && !Array.isArray(nosotrosHero)
      ? (nosotrosHero as Record<string, unknown>)
      : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Nosotros
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Contenido editorial del sitio: hero, misión, visión, filosofía e
          historia. Los cambios aparecen en la web tras el rebuild automático.
        </p>
      </div>

      <CollapsibleCard id="textos-estado" title="Estado de las claves">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </CollapsibleCard>

      <CollapsibleCard id="textos-hero" title="Hero de Nosotros">
        <NosotrosHeroForm
          initial={{
            title:
              typeof nosotrosHeroObj.title === "string"
                ? nosotrosHeroObj.title
                : undefined,
            lead:
              typeof nosotrosHeroObj.lead === "string"
                ? nosotrosHeroObj.lead
                : undefined,
            description:
              typeof nosotrosHeroObj.description === "string"
                ? nosotrosHeroObj.description
                : undefined,
            image:
              typeof nosotrosHeroObj.image === "string"
                ? nosotrosHeroObj.image
                : undefined,
          }}
        />
      </CollapsibleCard>

      <CollapsibleCard id="textos-mision" title="Misión y visión">
        <MisionVisionForm
          initial={{
            mision: typeof mision === "string" ? mision : undefined,
            vision: typeof vision === "string" ? vision : undefined,
          }}
        />
      </CollapsibleCard>

      <CollapsibleCard id="textos-filosofia" title="Filosofía">
        <FilosofiaForm initial={filosofiaItems} />
      </CollapsibleCard>

      <CollapsibleCard id="textos-historia" title="Historia">
        <HistoriaForm initial={historiaItems} />
      </CollapsibleCard>
    </div>
  );
}
