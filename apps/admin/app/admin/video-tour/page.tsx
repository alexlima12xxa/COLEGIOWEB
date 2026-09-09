import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { ContentKeysStatus } from "@/app/admin/components/content-keys-status";
import { VideoTourForm } from "./video-tour-form";

export const dynamic = "force-dynamic";

const CLAVES = ["video_tour"] as const;

export default async function VideoTourPage() {
  const { supabase } = await requireAdmin();

  const { data: filas } = await supabase
    .from("contenido")
    .select("clave, valor")
    .in("clave", [...CLAVES]);

  const porClave = new Map(
    (filas ?? []).map((fila) => [fila.clave, fila.valor]),
  );

  const videoTour = porClave.get("video_tour");
  const videoTourObj =
    videoTour && typeof videoTour === "object" && !Array.isArray(videoTour)
      ? (videoTour as Record<string, unknown>)
      : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Video tour
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Video de tour virtual de la portada. Los cambios aparecen en la web
          tras el rebuild automático.
        </p>
      </div>

      <ModuleCard id="video-tour-estado" title="Estado de las claves">
        <ContentKeysStatus supabase={supabase} claves={CLAVES} />
      </ModuleCard>

      <ModuleCard id="video-tour-form" title="Video tour">
        <VideoTourForm
          initial={{
            videoUrl:
              typeof videoTourObj.videoUrl === "string"
                ? videoTourObj.videoUrl
                : undefined,
            poster:
              typeof videoTourObj.poster === "string"
                ? videoTourObj.poster
                : undefined,
            title:
              typeof videoTourObj.title === "string"
                ? videoTourObj.title
                : undefined,
          }}
          posterJson={JSON.stringify(videoTourObj)}
        />
      </ModuleCard>
    </div>
  );
}
