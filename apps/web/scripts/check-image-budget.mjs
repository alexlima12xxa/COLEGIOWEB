// Presupuesto de imágenes above-the-fold (Paso 8, GATE 7).
//
// Post-build: analiza dist/index.html, extrae la imagen LCP (preload) y las
// primeras imágenes inline (orden del documento), suma su peso real desde
// dist/ y falla si supera el presupuesto móvil.
//
// Solo mide assets LOCALES (/branding/...). Las imágenes remotas de Storage se
// optimizan vía /_image (runtime, adapter Vercel) y no viven en dist.
//
// Uso: pnpm --filter @web-modelo/web check:budget
// Override del presupuesto: BUDGET_KB=400 pnpm ... check:budget
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DIST = existsSync(path.join("dist", "client", "index.html"))
  ? path.join("dist", "client")
  : "dist";
const INDEX = path.join(DIST, "index.html");
const BUDGET_KB = Number(process.env.BUDGET_KB || 500);
// LCP (preload) + las 3 primeras imágenes inline = above-the-fold típico.
const MAX_IMAGES = 4;

if (!existsSync(INDEX)) {
  console.warn(
    `[budget] ${INDEX} no existe; se omite (corre "pnpm build" antes).`,
  );
  process.exit(0);
}

const html = await readFile(INDEX, "utf8");

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"));
  return m ? m[1] : undefined;
};

const ordered = [];

// 1) Preload de imagen (LCP) — prioridad máxima.
for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
  if (/\brel=["']preload["']/i.test(tag) && /\bas=["']image["']/i.test(tag)) {
    const href = attr(tag, "href");
    if (href) ordered.push({ src: href, kind: "preload" });
  }
}

// 2) Imágenes inline en orden de documento.
for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
  const src = attr(tag, "src");
  if (src) ordered.push({ src, kind: "img" });
}

// Dedupe por src, conservando el orden; recorta a las above-fold.
const seen = new Set();
const aboveFold = ordered
  .filter((i) => (seen.has(i.src) ? false : seen.add(i.src)))
  .slice(0, MAX_IMAGES);

let total = 0;
let measured = 0;
const rows = [];

for (const { src, kind } of aboveFold) {
  // Solo assets locales servidos desde dist.
  if (!src.startsWith("/") || src.startsWith("/_image")) {
    rows.push({ src, kb: null, note: "remoto/optimizado" });
    continue;
  }
  const file = path.join(DIST, src.replace(/^\//, ""));
  if (!existsSync(file)) {
    rows.push({ src, kb: null, note: "no está en dist" });
    continue;
  }
  const { size } = await stat(file);
  const kb = size / 1024;
  total += kb;
  measured += 1;
  rows.push({ src, kb, note: kind });
}

console.log(`[budget] Above-the-fold (${measured} assets locales):`);
for (const r of rows) {
  const weight = r.kb === null ? `   ?   (${r.note})` : `${r.kb.toFixed(1)}KB`;
  console.log(`  ${weight.padStart(12)}  ${r.src}`);
}
console.log(`  ${"-".repeat(12)}`);
console.log(
  `  ${`${total.toFixed(1)}KB`.padStart(12)}  TOTAL (presupuesto ${BUDGET_KB}KB)`,
);

if (total > BUDGET_KB) {
  console.error(
    `\n[budget] FALLO: ${total.toFixed(1)}KB > ${BUDGET_KB}KB (móvil). ` +
      `Optimiza las imágenes above-the-fold o ajusta BUDGET_KB.`,
  );
  process.exit(1);
}

console.log(`\n[budget] OK: dentro del presupuesto (${BUDGET_KB}KB).`);
