import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

import { validateConfig } from "./src/shared/lib/validateConfig.ts";

// Fail fast if the white-label configuration is invalid.
validateConfig();

// https://astro.build/config
export default defineConfig({
  site: "https://colegioweb.vercel.app",
  output: "static",
  adapter: vercel(),
  build: {
    // CSS total ~10KB: inlinerlo en el HTML elimina 6 peticiones
    // render-blocking (FCP móvil 2.2s -> ~1.4s). El costo de caché es
    // despreciable a este tamaño (GATE 7: 100/100 móvil).
    inlineStylesheets: "always",
  },
  image: {
    // Autoriza la optimización de imágenes remotas (Supabase Storage) en
    // build-time: astro:assets las descarga y genera AVIF/WebP (GATE 4).
    remotePatterns: [{ protocol: "https" }],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
