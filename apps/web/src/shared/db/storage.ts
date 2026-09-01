import { siteConfig } from "../../site.config";

/**
 * Resolución de assets de Supabase Storage.
 *
 * Contrato de las columnas *_path de la BD: ruta RELATIVA al bucket público
 * "media" (ej. "noticias/portada.jpg"). Los fallbacks locales usan rutas de
 * /public (ej. "/branding/placeholders/..."). Este módulo unifica ambas.
 */

export const MEDIA_BUCKET = "media";

function supabaseBaseUrl(): string {
  return (process.env.PUBLIC_SUPABASE_URL || siteConfig.supabase.url).replace(
    /\/+$/,
    "",
  );
}

function isExternal(path: string): boolean {
  return /^https?:\/\//i.test(path) || path.startsWith("/");
}

/**
 * Resuelve una ruta de asset a una URL usable:
 * - ruta de Storage (relativa al bucket "media") → URL pública completa
 * - URL absoluta (http/https) o ruta local de /public → tal cual
 */
export function resolveAssetUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (isExternal(path)) return path;
  return `${supabaseBaseUrl()}/storage/v1/object/public/${MEDIA_BUCKET}/${path.replace(
    /^\/+/,
    "",
  )}`;
}
