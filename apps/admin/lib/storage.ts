export const MEDIA_BUCKET = "media";

// Resuelve una ruta relativa del bucket "media" a una URL pública usable.
// - Ruta relativa (ej. "noticias/portada.jpg") → URL pública completa.
// - URL absoluta o ruta local → tal cual.
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path.replace(/^\/+/, "")}`;
}
