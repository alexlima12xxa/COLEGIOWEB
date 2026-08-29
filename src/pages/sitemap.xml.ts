import type { APIRoute } from "astro";
import { siteConfig } from "../site.config";
import { getAllNoticias, NEWS_PER_PAGE } from "../shared/db/content";

/**
 * Sitemap dinámico (GATE 7).
 *
 * Generado en build-time a partir de:
 * - site.config.ts (páginas estáticas + niveles habilitados)
 * - getAllNoticias() (noticias + paginación)
 *
 * La URL base sale de siteConfig.seo.siteUrl (única fuente de verdad del
 * white-label), coherente con `site` en astro.config.ts.
 */

const baseUrl = siteConfig.seo.siteUrl.replace(/\/+$/, "");

function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  priority: number;
}

function absolute(path: string): string {
  // Astro usa formato `directory` (trailing slash). Normalizamos para que
  // cada <loc> coincida exactamente con el canonical de su página.
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return new URL(withSlash, baseUrl + "/").toString();
}

function renderEntry(entry: SitemapEntry): string {
  const lastmod = entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : "";
  return (
    "  <url>\n" +
    `    <loc>${absolute(entry.loc)}</loc>\n` +
    lastmod +
    `    <priority>${entry.priority.toFixed(1)}</priority>\n` +
    "  </url>"
  );
}

export const GET: APIRoute = async () => {
  const noticias = await getAllNoticias();
  const levels = siteConfig.levels.filter((level) => level.enabled);
  const totalPages = Math.max(1, Math.ceil(noticias.length / NEWS_PER_PAGE));

  const entries: SitemapEntry[] = [
    { loc: "/", priority: 1.0 },
    { loc: "/nosotros", priority: 0.8 },
    { loc: "/niveles", priority: 0.8 },
    { loc: "/admisiones", priority: 0.8 },
    { loc: "/noticias", priority: 0.8 },
    { loc: "/circulares", priority: 0.7 },
    { loc: "/contacto", priority: 0.7 },
    { loc: "/aviso-de-privacidad", priority: 0.3 },
  ];

  for (const level of levels) {
    entries.push({ loc: `/niveles/${level.slug}`, priority: 0.7 });
  }

  for (const noticia of noticias) {
    entries.push({
      loc: `/noticias/${noticia.slug}`,
      lastmod: toIsoDate(noticia.publicadoEn),
      priority: 0.6,
    });
  }

  for (let page = 2; page <= totalPages; page++) {
    entries.push({ loc: `/noticias/pagina/${page}`, priority: 0.4 });
  }

  const body = entries.map(renderEntry).join("\n");

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    body +
    "\n</urlset>";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
