"use client";

import { useEffect, useRef, useState } from "react";
import { BannerForm, buildPreviewUrlById } from "./banners-form";
import { DeleteBannerButton } from "./delete-button";
import { alternarBannerActivo, duplicarBanner } from "./actions";
import { BANNERS_SLUGS } from "@web-modelo/shared";

export interface BannerCardData {
  id: string;
  plantilla_id: string;
  plantillaLabel: string;
  orden: number;
  activo: boolean;
  title: string;
  datos: Record<string, unknown>;
}

function Thumb({
  id,
  token,
}: {
  id: string;
  token: string | null;
}) {
  const url = buildPreviewUrlById(id, token);
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!url) {
    return (
      <div className="flex items-center justify-center bg-zinc-100 py-16 text-xs text-zinc-400">
        Vista previa no disponible
      </div>
    );
  }

  // Renderiza el banner a tamaño de escritorio (1280×720 → el hero ocupa
  // 90dvh ≈ 648px) y lo escala con CSS para llenar exactamente el ancho de la
  // tarjeta. Se recorta el margen vertical sobrante (los 72px bajo el hero)
  // para que no queden franjas grises ni en ancho ni en alto.
  const SOURCE_W = 1280;
  const SOURCE_H = 720;
  const HERO_H = 648;
  const targetW = width ?? SOURCE_W / 2.5;
  const scale = targetW / SOURCE_W;
  const height = Math.max(1, Math.ceil(HERO_H * scale));

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-t-xl bg-zinc-900"
      style={{ height }}
    >
      <iframe
        src={url}
        title="Miniatura del banner"
        className="pointer-events-none border-0"
        style={{
          width: SOURCE_W,
          height: SOURCE_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        loading="lazy"
        scrolling="no"
      />
    </div>
  );
}

function BannerCard({
  banner,
  token,
}: {
  banner: BannerCardData;
  token: string | null;
}) {
  const [editando, setEditando] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <Thumb id={banner.id} token={token} />

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              {banner.plantillaLabel}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {banner.title || "Sin título"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
              banner.activo
                ? "bg-emerald-50 text-emerald-700"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {banner.activo ? "Activo" : "Inactivo"}
          </span>
        </div>

        <p className="text-xs text-zinc-400">Orden {banner.orden}</p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800"
          >
            {editando ? "Cerrar" : "Editar"}
          </button>

          <form action={alternarBannerActivo}>
            <input type="hidden" name="id" value={banner.id} />
            {!banner.activo ? (
              <input type="hidden" name="activo" value="on" />
            ) : null}
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              {banner.activo ? "Desactivar" : "Activar"}
            </button>
          </form>

          <form action={duplicarBanner}>
            <input type="hidden" name="id" value={banner.id} />
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Duplicar
            </button>
          </form>

          <DeleteBannerButton id={banner.id} titulo={banner.title || banner.plantillaLabel} />
        </div>
      </div>

      {editando ? (
        <div className="border-t border-zinc-100 bg-zinc-50/60 p-4">
          <BannerForm
            initial={{
              id: banner.id,
              plantilla_id: banner.plantilla_id,
              orden: banner.orden,
              activo: banner.activo,
              datos: banner.datos,
            }}
            previewToken={token}
          />
        </div>
      ) : null}
    </div>
  );
}

export function BannersGrid({
  banners,
  token,
}: {
  banners: BannerCardData[];
  token: string | null;
}) {
  const [mostrandoNuevo, setMostrandoNuevo] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner) => (
          <BannerCard key={banner.id} banner={banner} token={token} />
        ))}

        {mostrandoNuevo ? (
          <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/40 p-4">
            <BannerForm
              initial={{
                plantilla_id: BANNERS_SLUGS[0],
                orden: banners.length,
                activo: true,
                datos: {},
              }}
              previewToken={token}
            />
          </div>
        ) : null}
      </div>

      {!mostrandoNuevo ? (
        <button
          type="button"
          onClick={() => setMostrandoNuevo(true)}
          className="rounded-xl border-2 border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-500 transition hover:border-blue-400 hover:text-blue-700"
        >
          + Nuevo banner
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setMostrandoNuevo(false)}
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700"
        >
          Cancelar nuevo banner
        </button>
      )}
    </div>
  );
}