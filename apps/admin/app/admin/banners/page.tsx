import { requireAdmin } from "@/lib/auth";
import { BannersGrid, type BannerCardData } from "./banners-grid";
import { CATALOGO_BANNERS } from "@web-modelo/shared";
import { signPreviewToken } from "@/lib/preview-token";

export const dynamic = "force-dynamic";

const PLANTILLA_LABEL: Record<string, string> = Object.fromEntries(
  CATALOGO_BANNERS.map((c) => [c.slug, c.nombre]),
);

export default async function BannersPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("banners")
    .select("id, plantilla_id, orden, activo, datos")
    .order("orden", { ascending: true });

  const banners: BannerCardData[] = (data ?? []).map((b) => {
    const datos =
      b.datos && typeof b.datos === "object" && !Array.isArray(b.datos)
        ? (b.datos as Record<string, unknown>)
        : {};
    return {
      id: b.id,
      plantilla_id: b.plantilla_id,
      plantillaLabel: PLANTILLA_LABEL[b.plantilla_id] ?? b.plantilla_id,
      orden: b.orden ?? 0,
      activo: b.activo ?? true,
      title: typeof datos.title === "string" ? datos.title : "",
      datos,
    };
  });

  // Token firmado (TTL 5 min) para autorizar la carga de /preview-admin. Se
  // emite una vez al renderizar la página, no por keystroke.
  const previewToken = signPreviewToken();

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

      <BannersGrid banners={banners} token={previewToken} />
    </div>
  );
}