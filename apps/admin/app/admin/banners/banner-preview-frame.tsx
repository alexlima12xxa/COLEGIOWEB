"use client";

import { useEffect, useRef, useState } from "react";

// El preview (iframe) renderiza la web real a ancho de escritorio. El banner ya
// no mide 80vh: el marco (.banner) tiene height:auto y su alto = alto del canvas
// (ver _banner.css, Arquitectura A). Por eso el alto del iframe se deriva SOLO
// de la proporción del canvas de la plantilla (anchoFigma/altoFigma): sin
// supuestos de viewport ni recortes.
const SOURCE_W = 1280;

export function BannerPreviewFrame({
  url,
  ancho,
  alto,
  className,
}: {
  url: string;
  /** Ancho del canvas Figma de la plantilla (px). */
  ancho: number;
  /** Alto del canvas Figma de la plantilla (px). */
  alto: number;
  className?: string;
}) {
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

  // Alto del canvas a SOURCE_W. El banner lo llena exacto (height:auto), así que
  // el iframe no necesita recorte ni offset.
  const canvasH = SOURCE_W * (alto / ancho);
  const targetW = width ?? SOURCE_W / 2.5;
  const scale = targetW / SOURCE_W;
  const height = Math.max(1, Math.ceil(canvasH * scale));

  return (
    <div
      ref={ref}
      className={className}
      style={{ height, position: "relative", overflow: "hidden" }}
    >
      <iframe
        src={url}
        title="Vista previa del banner"
        className="pointer-events-none border-0"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: SOURCE_W,
          height: canvasH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
        loading="lazy"
        scrolling="no"
      />
    </div>
  );
}
