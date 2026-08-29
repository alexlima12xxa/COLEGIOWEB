import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Script único de migración de los fallbacks JSON a Astro Content Collections.
 *
 * Genera archivos editables por Decap CMS en src/content/ a partir de los
 * datos semilla de src/data/fallback/. Se puede volver a ejecutar para
 * reconstruir el contenido inicial; los cambios manuales posteriores en
 * src/content/ se perderían, por lo que debe usarse con cuidado.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fallbackDir = path.join(root, "src/data/fallback");
const contentDir = path.join(root, "src/content");

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function yamlValue(value) {
  if (value === undefined || value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return JSON.stringify(String(value));
}

function yamlFrontmatter(obj) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    lines.push(`${key}: ${yamlValue(value)}`);
  }
  lines.push("---");
  return lines.join("\n");
}

function createMarkdown(frontmatter, body = "") {
  return `${yamlFrontmatter(frontmatter)}\n\n${body}`.trimEnd() + "\n";
}

async function readJson(name) {
  const filePath = path.join(fallbackDir, name);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

async function seedNoticias() {
  const data = await readJson("noticias.json");
  const dir = path.join(contentDir, "noticias");
  await fs.mkdir(dir, { recursive: true });

  for (const item of data.items) {
    const { contenido, ...frontmatter } = item;
    delete frontmatter.id;
    const file = path.join(dir, `${frontmatter.slug}.md`);
    await fs.writeFile(file, createMarkdown(frontmatter, contenido));
  }

  console.log(`[seed] ${data.items.length} noticias creadas`);
}

async function seedCirculares() {
  const data = await readJson("circulares.json");
  const dir = path.join(contentDir, "circulares");
  await fs.mkdir(dir, { recursive: true });

  for (const item of data.items) {
    const frontmatter = { ...item };
    delete frontmatter.id;
    const fileSlug = slugify(item.titulo);
    const file = path.join(dir, `${fileSlug}.md`);
    await fs.writeFile(file, createMarkdown(frontmatter));
  }

  console.log(`[seed] ${data.items.length} circulares creadas`);
}

async function seedPaginas() {
  const paginas = [
    {
      slug: "inicio",
      titulo: "Inicio",
      descripcion:
        "Bienvenidos al sitio oficial del colegio. Aquí puedes editar el texto introductorio de la página de inicio.",
      contenido:
        "Formamos líderes para el futuro con excelencia académica y valores sólidos.",
    },
    {
      slug: "nosotros",
      titulo: "Nosotros",
      descripcion:
        "Texto principal de la página institucional: historia, misión y visión.",
      contenido:
        "Somos una institución educativa con décadas de trayectoria formando estudiantes íntegros, críticos y preparados para los desafíos del mundo actual.",
    },
    {
      slug: "admisiones",
      titulo: "Admisiones",
      descripcion:
        "Información clave para familias interesadas en el proceso de admisión.",
      contenido:
        "Nuestro proceso de admisión está diseñado para conocer a cada familia y acompañarla en la integración a la comunidad educativa.",
    },
    {
      slug: "niveles",
      titulo: "Niveles educativos",
      descripcion:
        "Resumen de la oferta académica por niveles: preescolar, primaria, secundaria y media técnica.",
      contenido:
        "Ofrecemos una propuesta educativa articulada desde preescolar hasta media técnica, centrada en el desarrollo integral de cada estudiante.",
    },
    {
      slug: "contacto",
      titulo: "Contacto",
      descripcion:
        "Mensaje de bienvenida de la página de contacto y canales de atención.",
      contenido:
        "Estamos atentos a resolver tus dudas. Escríbenos o visita nuestras instalaciones en el horario de atención.",
    },
  ];

  const dir = path.join(contentDir, "paginas");
  await fs.mkdir(dir, { recursive: true });

  for (const pagina of paginas) {
    const { contenido, ...frontmatter } = pagina;
    const file = path.join(dir, `${pagina.slug}.md`);
    await fs.writeFile(file, createMarkdown(frontmatter, contenido));
  }

  console.log(`[seed] ${paginas.length} páginas creadas`);
}

async function seedGaleria() {
  const home = await readJson("home.json");
  const items = (home.bentoGallery ?? []).map((item, index) => {
    const slug = slugify(item.alt);
    return {
      slug,
      titulo: item.alt,
      categoria: item.variant,
      imagenPath: item.src,
      imagenAlt: item.alt,
      orden: index,
      publicadoEn: "2026-08-01T10:00:00+00:00",
    };
  });

  const dir = path.join(contentDir, "galeria");
  await fs.mkdir(dir, { recursive: true });

  for (const item of items) {
    const file = path.join(dir, `${item.slug}.md`);
    await fs.writeFile(file, createMarkdown(item));
  }

  console.log(`[seed] ${items.length} imágenes de galería creadas`);
}

async function main() {
  await fs.mkdir(contentDir, { recursive: true });
  await seedNoticias();
  await seedCirculares();
  await seedPaginas();
  await seedGaleria();
  console.log("[seed] Contenido inicial generado en src/content/");
}

main().catch((error) => {
  console.error("[seed] Error generando contenido:", error);
  process.exit(1);
});
