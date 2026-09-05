import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite subir imágenes/PDFs desde las Server Actions del panel.
  // El bucket "media" acepta archivos hasta 10 MB (ver init.sql).
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // El paquete compartido (catálogo de banners, paletas, contratos) exporta
  // TypeScript fuente; Next debe transpilarlo para poder usarlo.
  transpilePackages: ["@web-modelo/shared"],
};

export default nextConfig;
