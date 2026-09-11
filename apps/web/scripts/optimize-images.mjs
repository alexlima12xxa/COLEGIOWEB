// Optimización de imágenes locales de /public/branding (Paso 8, GATE 7).
//
// astro:assets NO procesa /public, así que estos assets se sirven tal cual.
// Este script los recomprime EN SITIO (misma ruta) para reducir peso sin tocar
// referencias en configs ni fallbacks JSON. Es idempotente: correrlo dos veces
// no degrada más la imagen (mozjpeg re-encode estable).
//
// Uso: pnpm --filter @web-modelo/web optimize:images
//
// sharp es dependencia directa de la app (@web-modelo/web), se importa por nombre.
import sharp from "sharp";
import { readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";

const BASE = "public/branding/placeholders";

/**
 * Ancho máximo objetivo por grupo. Se aplica `withoutEnlargement` para no
 * escalar hacia arriba imágenes ya pequeñas. El render real es <= 600px en
 * móvil y <= 1200px en desktop.
 */
const targets = [
  { in: `${BASE}/level-preescolar.jpg`, width: 960, quality: 72 },
  { in: `${BASE}/level-primaria.jpg`, width: 960, quality: 72 },
  { in: `${BASE}/level-secundaria.jpg`, width: 960, quality: 72 },
  { in: `${BASE}/about-campus.jpg`, width: 960, quality: 72 },
  { in: `${BASE}/gallery-1.jpg`, width: 800, quality: 70 },
  { in: `${BASE}/gallery-2.jpg`, width: 800, quality: 70 },
  { in: `${BASE}/gallery-3.jpg`, width: 800, quality: 70 },
  { in: `${BASE}/gallery-4.jpg`, width: 800, quality: 70 },
  { in: `${BASE}/gallery-5.jpg`, width: 800, quality: 70 },
  { in: `${BASE}/gallery-6.jpg`, width: 800, quality: 70 },
  { in: `${BASE}/authority-1.jpg`, width: 600, quality: 72 },
  { in: `${BASE}/authority-2.jpg`, width: 600, quality: 72 },
  { in: `${BASE}/authority-3.jpg`, width: 600, quality: 72 },
  { in: `${BASE}/authority-4.jpg`, width: 600, quality: 72 },
  // Hero: ya optimizado antes, se re-valida aquí para tener un único script.
  { in: `${BASE}/hero-photo.jpg`, width: 640, quality: 62 },
  { in: `${BASE}/hero-tour-poster.jpg`, width: 960, quality: 72 },
];

const kb = (bytes) => `${Math.round(bytes / 1024)}KB`;

let totalBefore = 0;
let totalAfter = 0;

for (const t of targets) {
  const before = (await readFile(t.in)).length;
  const optimized = await sharp(t.in)
    .resize({ width: t.width, withoutEnlargement: true })
    .jpeg({ quality: t.quality, progressive: true, mozjpeg: true })
    .toBuffer();

  // rename-based replace: evita locks de escritura sobre el original.
  const tmp = `${t.in}.tmp`;
  await writeFile(tmp, optimized);
  await rename(tmp, t.in);

  totalBefore += before;
  totalAfter += optimized.length;
  const pct =
    before > 0 ? Math.round((1 - optimized.length / before) * 100) : 0;
  console.log(`${t.in}: ${kb(before)} -> ${kb(optimized.length)} (-${pct}%)`);
}

console.log(
  `\nTotal: ${kb(totalBefore)} -> ${kb(totalAfter)} (ahorro ${kb(totalBefore - totalAfter)})`,
);

// AVIF del hero (elemento LCP): ~50% menos peso que JPEG con mejor calidad
// perceptual. `siteConfig.branding.assets.heroPhoto` apunta a este .avif.
{
  const src = `${BASE}/hero-photo.jpg`;
  const dst = `${BASE}/hero-photo.avif`;
  const before = existsSync(dst) ? (await readFile(dst)).length : 0;
  const optimized = await sharp(src)
    .resize({ width: 640, withoutEnlargement: true })
    .avif({ quality: 50, effort: 6 })
    .toBuffer();
  await writeFile(dst, optimized);
  console.log(
    `hero-photo.avif: ${kb(before)} -> ${kb(optimized.length)} (640px w)`,
  );
}
