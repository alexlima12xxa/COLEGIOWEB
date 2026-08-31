import { z } from "astro/zod";
import { getDbContext } from "./client";
import {
  noticiaSchema,
  circularSchema,
  noticiasFallbackSchema,
  circularesFallbackSchema,
} from "./schema";
import type { Noticia, Circular } from "./schema";
import noticiasFallbackData from "../../data/fallback/noticias.json";
import circularesFallbackData from "../../data/fallback/circulares.json";

/**
 * Repositorios de contenido.
 *
 * Supabase es la ÚNICA fuente de contenido editorial. Si no está configurada
 * (service role + tenant, build-time) o no devuelve datos, se usa el fallback
 * JSON versionado. Las consultas nunca lanzan errores por BD ausente o caída
 * de red: se registra un warning y se usa el fallback (criterio de aceptación).
 *
 * El resultado de la Data API se valida con el MISMO zod que los fallbacks.
 */

export const NEWS_PER_PAGE = 9;

export interface NewsPageResult {
  items: Noticia[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

let noticiasCache: Noticia[] | undefined;
let circularesCache: Circular[] | undefined;

function fallbackNoticias(): Noticia[] {
  return noticiasFallbackSchema.parse(noticiasFallbackData).items;
}

function fallbackCirculares(): Circular[] {
  return circularesFallbackSchema.parse(circularesFallbackData).items;
}

export async function getAllNoticias(): Promise<Noticia[]> {
  if (noticiasCache) return noticiasCache;

  const context = getDbContext();
  if (context) {
    try {
      const { data, error } = await context.client
        .from("noticias")
        .select(
          "id, slug, titulo, resumen, contenido, imagen_path as imagenPath, imagen_alt as imagenAlt, autor, publicado_en as publicadoEn",
        )
        .eq("tenant_id", context.config.tenantId)
        .eq("publicado", true)
        .order("publicado_en", { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        noticiasCache = z.array(noticiaSchema).parse(data);
        return noticiasCache;
      }
    } catch (error) {
      console.warn(
        "[db] No se pudieron leer noticias de Supabase. Usando fallback local.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  noticiasCache = fallbackNoticias();
  return noticiasCache;
}

export async function getNewsPage(
  page: number,
  perPage: number = NEWS_PER_PAGE,
): Promise<NewsPageResult> {
  const all = await getAllNoticias();
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Number.isFinite(page) ? Math.floor(Math.max(1, page)) : 1;
  const clampedPage = Math.min(safePage, totalPages);
  const start = (clampedPage - 1) * perPage;

  return {
    items: all.slice(start, start + perPage),
    page: clampedPage,
    perPage,
    total,
    totalPages,
  };
}

export async function getNoticiaBySlug(
  slug: string,
): Promise<Noticia | undefined> {
  const all = await getAllNoticias();
  return all.find((noticia) => noticia.slug === slug);
}

export async function getAllCirculares(): Promise<Circular[]> {
  if (circularesCache) return circularesCache;

  const context = getDbContext();
  if (context) {
    try {
      const { data, error } = await context.client
        .from("circulares")
        .select(
          "id, titulo, descripcion, categoria, fecha, archivo_path as archivoPath, archivo_nombre as archivoNombre, publicado_en as publicadoEn",
        )
        .eq("tenant_id", context.config.tenantId)
        .eq("publicado", true)
        .order("fecha", { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        circularesCache = z.array(circularSchema).parse(data);
        return circularesCache;
      }
    } catch (error) {
      console.warn(
        "[db] No se pudieron leer circulares de Supabase. Usando fallback local.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  circularesCache = fallbackCirculares();
  return circularesCache;
}
