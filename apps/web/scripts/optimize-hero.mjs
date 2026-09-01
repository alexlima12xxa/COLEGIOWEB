// Optimización de imágenes del hero (Paso 8, GATE 7)
// Redimensiona al ancho máximo de render móvil y re-comprime.
// Uso único: node scripts/optimize-hero.mjs
// (sharp se importa directo desde el store de pnpm: es dependencia de astro)
import sharp from "../node_modules/.pnpm/sharp@0.35.4/node_modules/sharp/dist/index.mjs";
import { readFile, writeFile } from "node:fs/promises";

const targets = [
  {
    in: "public/branding/placeholders/hero-photo.jpg",
    out: "public/branding/placeholders/hero-photo.jpg",
    width: 640, // 1.7x del render móvil (380px): equilibra calidad retina y peso
    quality: 62,
  },
  {
    in: "public/branding/placeholders/hero-tour-poster.jpg",
    out: "public/branding/placeholders/hero-tour-poster.jpg",
    width: 960,
    quality: 72,
  },
];

for (const t of targets) {
  const before = (await readFile(t.in)).length;
  const optimized = await sharp(t.in)
    .resize({ width: t.width, withoutEnlargement: true })
    .jpeg({ quality: t.quality, progressive: true, mozjpeg: true })
    .toBuffer();
  // rename-based replace: evita locks de escritura sobre el archivo original
  const tmp = `${t.out}.tmp`;
  await writeFile(tmp, optimized);
  const { rename } = await import("node:fs/promises");
  await rename(tmp, t.out);
  const after = optimized.length;
  console.log(
    `${t.in}: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB (${t.width}px w)`,
  );
}

// AVIF para el hero-photo (LCP element): ~50% menos peso que JPEG con
// mejor calidad perceptual. Soporte universal en navegadores modernos.
{
  const src = "public/branding/placeholders/hero-photo.jpg";
  const dst = "public/branding/placeholders/hero-photo.avif";
  const optimized = await sharp(src)
    .resize({ width: 640, withoutEnlargement: true })
    .avif({ quality: 50, effort: 6 })
    .toBuffer();
  await writeFile(dst, optimized);
  console.log(
    `hero-photo.avif: ${Math.round(optimized.length / 1024)}KB (640px w)`,
  );
}
