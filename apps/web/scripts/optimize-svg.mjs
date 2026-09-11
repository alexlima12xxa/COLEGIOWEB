// Optimización de SVGs locales de /public/branding con SVGO.
//
// Recomprime en sitio (misma ruta) para no tocar referencias. Idempotente:
// SVGO es determinista, correrlo dos veces no cambia el resultado.
//
// Uso: pnpm --filter @web-modelo/web optimize:svg
import { optimize } from "svgo";
import { readFile, writeFile, rename } from "node:fs/promises";

const BASE = "public/branding";
const targets = [
  `${BASE}/logo.svg`,
  `${BASE}/logo-inverse.svg`,
  `${BASE}/favicon.svg`,
  `${BASE}/og-image.svg`,
];

// preset-default. En SVGO v4 `removeViewBox` ya no forma parte del preset, por
// lo que el viewBox (crítico para escalado responsive) se preserva por defecto.
const config = {
  plugins: ["preset-default"],
};

const kb = (bytes) => `${(bytes / 1024).toFixed(2)}KB`;

let totalBefore = 0;
let totalAfter = 0;

for (const file of targets) {
  const svg = await readFile(file, "utf8");
  const before = Buffer.byteLength(svg, "utf8");
  const { data } = optimize(svg, { path: file, ...config });

  const tmp = `${file}.tmp`;
  await writeFile(tmp, data, "utf8");
  await rename(tmp, file);

  totalBefore += before;
  totalAfter += Buffer.byteLength(data, "utf8");
  console.log(
    `${file}: ${kb(before)} -> ${kb(Buffer.byteLength(data, "utf8"))}`,
  );
}

console.log(`\nTotal: ${kb(totalBefore)} -> ${kb(totalAfter)}`);
