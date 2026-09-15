import { resolveAssetUrl } from "./storage";

/**
 * Accesibilidad de imágenes remotas de Supabase Storage.
 *
 * Helper único compartido por los repositorios (noticias, circulares, banners)
 * y por el componente ContentImage. Evita repetir requests HEAD por el mismo
 * asset dentro de un build (caché a nivel de módulo) y degrada a un placeholder
 * local cuando la imagen no responde, para que una imagen rota no tumbe el
 * build (criterio de aceptación).
 */

/**
 * Placeholder local usado cuando una imagen remota de Supabase Storage no es
 * accesible. Ruta de /public (nunca pasa por astro:assets, se sirve tal cual).
 */
export const IMAGE_FALLBACK = "/branding/placeholders/gallery-1.jpg";

/**
 * Cache a nivel de módulo del resultado de accesibilidad por URL resuelta.
 * Evita repetir requests HEAD por el mismo asset dentro de un mismo build
 * (una noticia se renderiza en card + detalle, y varias noticias pueden
 * compartir placeholder).
 */
const imageAccessCache = new Map<string, boolean>();

/**
 * Comprueba si una URL remota responde con status 2xx (accesible).
 * Solo se considera válido un 2xx: Supabase Storage devuelve 404 para objetos
 * faltantes y 400 para rutas malformadas. Cualquier otro código (o error de
 * red) se trata como inaccesible para no romper el build. La petición se
 * aborta a los 2.5s para que una red colgada no bloquee el build.
 */
export async function isImageAccessible(url: string): Promise<boolean> {
  const cached = imageAccessCache.get(url);
  if (cached !== undefined) return cached;

  let accessible: boolean;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(2500),
    });
    accessible = res.status >= 200 && res.status < 300;
  } catch {
    accessible = false;
  }

  imageAccessCache.set(url, accessible);
  return accessible;
}

/**
 * Valida la accesibilidad de una imagen remota de Storage y devuelve una ruta
 * segura:
 *  - Si la ruta es local (/public) o no es de Storage, se devuelve tal cual.
 *  - Si es de Storage y accesible, se devuelve tal cual.
 *  - Si es de Storage e inaccesible, se sustituye por un placeholder local.
 *
 * Nunca lanza: una imagen rota no debe tumbar el build (criterio de
 * aceptación), se degrada a placeholder.
 */
export async function ensureAccessibleImage(
  path?: string,
): Promise<string | undefined> {
  if (!path) return undefined;
  // Rutas locales de /public o URLs absolutas externas: no se validan.
  if (path.startsWith("/") || /^https?:\/\//i.test(path)) return path;

  const resolved = resolveAssetUrl(path);
  if (!resolved) return path;

  const accessible = await isImageAccessible(resolved);
  return accessible ? path : IMAGE_FALLBACK;
}
