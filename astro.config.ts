import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

import { validateConfig } from "./src/shared/lib/validateConfig.ts";

// Fail fast if the white-label configuration is invalid.
validateConfig();

// https://astro.build/config
export default defineConfig({
  site: "https://tuapp.com",
  output: "static",
  adapter: vercel(),
  build: {
    inlineStylesheets: "never",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
