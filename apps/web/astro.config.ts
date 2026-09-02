import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

import { siteConfig } from "./src/site.config";
import { validateConfig } from "./src/shared/lib/validateConfig.ts";

// Fail fast if the white-label configuration is invalid.
validateConfig();

// https://astro.build/config
export default defineConfig({
  // El origen canónico sale de la config del colegio activo (seleccionada por
  // PUBLIC_SITE_SLUG). Así cada build genera canónicos/og:url con su dominio.
  site: siteConfig.seo.siteUrl,
  output: "static",
  adapter: vercel(),
  build: {
    // CSS total ~10KB: inlinerlo en el HTML elimina 6 peticiones
    // render-blocking (FCP móvil 2.2s -> ~1.4s). El costo de caché es
    // despreciable a este tamaño (GATE 7: 100/100 móvil).
    inlineStylesheets: "always",
  },
  image: {
    // Restringe la optimización de imágenes remotas a Supabase Storage.
    // Las imágenes remotas se sirven y optimizan vía el endpoint /_image en
    // runtime (serverless Vercel), con cache del CDN. Las imágenes LOCALES
    // (fallbacks /branding/ en /public) NO pasan por astro:assets.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
