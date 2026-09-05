/**
 * Genera `apps/web/public/requisitos-admisiones-2026.pdf`, un PDF estático
 * de una página con la lista de requisitos por nivel.
 *
 * La web (SSG) enlaza este archivo con `download` desde la sección
 * "Documentación y Requisitos por Nivel". El contenido duplica el fallback
 * `src/data/fallback/admissions.json` (requisitosPorNivel) porque un script
 * .mjs no puede importar los .astro/.ts de la web sin un paso de build.
 *
 * Regenerar tras cambiar los requisitos:
 *   node scripts/generar-pdf-requisitos.mjs
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/requisitos-admisiones-2026.pdf");

const NIVELES = [
  {
    nombre: "Preescolar (3 a 5 años)",
    requisitos: [
      {
        title: "Registro civil de nacimiento",
        formato: "PDF o JPG legible (máx. 5MB)",
      },
      {
        title: "Documento de identidad de los acudientes",
        formato: "PDF o JPG legible (máx. 5MB)",
      },
      {
        title: "Certificado de desarrollo o jardín",
        formato: "Documento oficial sellado (PDF)",
      },
      { title: "Fotografía reciente", formato: "JPG o PNG (máx. 2MB)" },
      {
        title: "Certificado de salud y vacunación",
        formato: "Documento oficial sellado (PDF)",
      },
    ],
  },
  {
    nombre: "Primaria (6 a 10 años)",
    requisitos: [
      {
        title: "Registro civil de nacimiento",
        formato: "PDF o JPG legible (máx. 5MB)",
      },
      {
        title: "Documento de identidad de los acudientes",
        formato: "PDF o JPG legible (máx. 5MB)",
      },
      {
        title: "Certificado de notas del año anterior",
        formato: "Documento oficial sellado (PDF)",
      },
      {
        title: "Paz y salvo de la institución anterior",
        formato: "Documento oficial sellado (PDF)",
      },
      { title: "Fotografía reciente", formato: "JPG o PNG (máx. 2MB)" },
    ],
  },
  {
    nombre: "Secundaria (11 a 17 años)",
    requisitos: [
      {
        title: "Registro civil de nacimiento",
        formato: "PDF o JPG legible (máx. 5MB)",
      },
      {
        title: "Documento de identidad del estudiante",
        formato: "PDF o JPG legible (máx. 5MB)",
      },
      {
        title: "Certificado de notas del año anterior",
        formato: "Documento oficial sellado (PDF)",
      },
      {
        title: "Paz y salvo de la institución anterior",
        formato: "Documento oficial sellado (PDF)",
      },
      {
        title: "Certificado de conducta y conformidad",
        formato: "Documento oficial sellado (PDF)",
      },
    ],
  },
];

// ── Escapado de strings para el flujo de contenido PDF ─────────────────────
function esc(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

// ── Construcción del contenido (flujo de texto) ────────────────────────────
const PAGE_H = 842;

const lines = [];
function textLine(x, y, str, size, bold = false) {
  lines.push(
    `BT /${bold ? "F1" : "F2"} ${size} Tf ${x} ${y} Td (${esc(str)}) Tj ET`,
  );
}

let y = PAGE_H - 64;
textLine(48, y, "Requisitos de Admisión 2026", 18, true);
y -= 24;
textLine(48, y, "Documentación oficial requerida por nivel educativo", 10);
y -= 30;

for (const nivel of NIVELES) {
  textLine(48, y, nivel.nombre, 13, true);
  y -= 22;
  for (const req of nivel.requisitos) {
    textLine(56, y, `- ${req.title}`, 10);
    y -= 16;
    textLine(64, y, `Formato: ${req.formato}`, 9);
    y -= 18;
  }
  y -= 10;
}

const content = lines.join("\n");

// ── Objetos del PDF ────────────────────────────────────────────────────────
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
];

let pdf = "%PDF-1.4\n";
const offsets = [];
objects.forEach((obj, i) => {
  offsets.push(Buffer.byteLength(pdf, "latin1"));
  pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
});

const xrefOffset = Buffer.byteLength(pdf, "latin1");
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";
for (const off of offsets) {
  pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

writeFileSync(OUT, Buffer.from(pdf, "latin1"));
console.log(
  `PDF generado en ${OUT} (${Buffer.byteLength(pdf, "latin1")} bytes)`,
);
