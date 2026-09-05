import { requireAdmin } from "@/lib/auth";
import { ModuleCard } from "@/app/admin/components/module-card";
import { BannerForm } from "./banners-form";
import { DeleteBannerButton } from "./delete-button";
import { CATALOGO_BANNERS } from "@web-modelo/shared";

export const dynamic = "force-dynamic";

const PLANTILLA_LABEL: Record<string, string> = Object.fromEntries(
  CATALOGO_BANNERS.map((c) => [c.slug, c.nombre]),
);

interface BannerRow {
  id: string;
  plantilla_id: string;
  orden: number;
  activo: boolean;
  datos: Record<string, unknown>;
}

export default async function BannersPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("banners")
    .select("id, plantilla_id, orden, activo, datos")
    .order("orden", { ascending: true });

  const banners: BannerRow[] = (data ?? []).map((b) => ({
    id: b.id,
    plantilla_id: b.plantilla_id,
    orden: b.orden ?? 0,
    activo: b.activo ?? true,
    datos:
      b.datos && typeof b.datos === "object" && !Array.isArray(b.datos)
        ? (b.datos as Record<string, unknown>)
        : {},
  }));

  const str = (v: unknown) => (typeof v === "string" ? v : "");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Banners del hero
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Slider de portada a ancho completo. Cuando hay banners activos,
          reemplazan al hero por defecto. Los cambios aparecen en la web tras el
          rebuild automático.
        </p>
      </div>

      {banners.map((banner) => (
        <ModuleCard
          key={banner.id}
          id={`banner-${banner.id}`}
          title={`${PLANTILLA_LABEL[banner.plantilla_id] ?? banner.plantilla_id} · orden ${banner.orden}${banner.activo ? "" : " (inactivo)"}`}
        >
          <div className="mb-4 flex justify-end">
            <DeleteBannerButton
              id={banner.id}
              titulo={str(banner.datos.title) || banner.plantilla_id}
            />
          </div>
          <BannerForm
            initial={{
              id: banner.id,
              plantilla_id: banner.plantilla_id,
              orden: banner.orden,
              activo: banner.activo,
              datos: banner.datos,
            }}
          />
        </ModuleCard>
      ))}

      <ModuleCard id="banner-nuevo" title="Nuevo banner">
        <BannerForm
          initial={{
            plantilla_id: "duotono",
            orden: banners.length,
            activo: true,
            datos: {},
          }}
        />
      </ModuleCard>
    </div>
  );
}