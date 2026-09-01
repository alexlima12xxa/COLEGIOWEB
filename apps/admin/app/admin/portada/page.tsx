import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { HeroForm, VideoTourForm } from "./portada-form";

export const dynamic = "force-dynamic";

const CLAVES = ["hero", "video_tour"] as const;

export default async function PortadaPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map((filas ?? []).map((fila) => [fila.clave, fila.valor]));

  const hero = porClave.get("hero");
  const videoTour = porClave.get("video_tour");

  const heroObj =
    hero && typeof hero === "object" && !Array.isArray(hero)
      ? (hero as Record<string, unknown>)
      : {};
  const videoTourObj =
    videoTour && typeof videoTour === "object" && !Array.isArray(videoTour)
      ? (videoTour as Record<string, unknown>)
      : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Portada
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Hero de la portada y video tour virtual. Los cambios aparecen en la
          web tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="portada-estado" title="Estado de las claves">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="portada-hero" title="Hero">
        <HeroForm
          initial={{
            heroPhoto:
              typeof heroObj.heroPhoto === "string" ? heroObj.heroPhoto : undefined,
            name: typeof heroObj.name === "string" ? heroObj.name : undefined,
            slogan: typeof heroObj.slogan === "string" ? heroObj.slogan : undefined,
            description:
              typeof heroObj.description === "string" ? heroObj.description : undefined,
          }}
          heroJson={JSON.stringify(heroObj)}
        />
      </ModuleCard>

      <ModuleCard id="portada-video" title="Video tour">
        <VideoTourForm
          initial={{
            videoUrl:
              typeof videoTourObj.videoUrl === "string"
                ? videoTourObj.videoUrl
                : undefined,
            poster:
              typeof videoTourObj.poster === "string" ? videoTourObj.poster : undefined,
            title:
              typeof videoTourObj.title === "string" ? videoTourObj.title : undefined,
          }}
          posterJson={JSON.stringify(videoTourObj)}
        />
      </ModuleCard>
    </div>
  );
}
