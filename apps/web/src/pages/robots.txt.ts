import type { APIRoute } from "astro";
import { siteConfig } from "../site.config";

/**
 * robots.txt (GATE 7).
 *
 * Generado en build-time. La URL del sitemap sale de siteConfig.seo.siteUrl
 * (única fuente de verdad del white-label).
 *
 * - Se permite el rastreo de todo el contenido público.
 * - Se bloquea /admin/ (área del CMS Decap, no indexable).
 */

const baseUrl = siteConfig.seo.siteUrl.replace(/\/+$/, "");

export const GET: APIRoute = async () => {
  const body =
    "User-agent: *\n" +
    "Allow: /\n" +
    "\n" +
    "Disallow: /admin/\n" +
    "\n" +
    `Sitemap: ${baseUrl}/sitemap.xml\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
