import { z } from "astro/zod";
import { getCollection, type CollectionEntry } from "astro:content";
import { getDbContext } from "./client";
import {
  noticiaSchema,
  circularSchema,
  noticiasFallbackSchema,
  circularesFallbackSchema,
} from "./schema";
import type { Noticia, Circular } from "./schema";
import { uuidv5 } from "../lib/uuid";
import noticiasFallbackData from "../../data/fallback/noticias.json";
import circularesFallbackData from "../../data/fallback/circulares.json";

/**
 * Repositorios de contenido (GATE 4).
 *
 * Estrategia: Supabase si está configurada (service role, build-time), sino
 * fallback local. Las consultas nunca lanzan errores por BD ausente o caída
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

function toNoticia(entry: CollectionEntry<"noticias">): Noticia {
  return noticiaSchema.parse({
    id: uuidv5(entry.data.slug),
    slug: entry.data.slug,
    titulo: entry.data.titulo,
    resumen: entry.data.resumen,
    contenido: entry.body,
    imagenPath: entry.data.imagenPath,
    imagenAlt: entry.data.imagenAlt,
    autor: entry.data.autor,
    publicadoEn: entry.data.publicadoEn,
  });
}

function fileSlug(id: string): string {
  return (
    id
      .replace(/\.mdx?$/, "")
      .split(/[\\/]/)
      .pop() ?? id
  );
}

function toCircular(entry: CollectionEntry<"circulares">): Circular {
  return circularSchema.parse({
    id: uuidv5(fileSlug(entry.id)),
    titulo: entry.data.titulo,
    descripcion: entry.data.descripcion,
    categoria: entry.data.categoria,
    fecha: entry.data.fecha,
    archivoPath: entry.data.archivoPath,
    archivoNombre: entry.data.archivoNombre,
    publicadoEn: entry.data.publicadoEn,
  });
}

async function getCmsNoticias(): Promise<Noticia[]> {
  const entries = await getCollection("noticias");
  return entries
    .map(toNoticia)
    .sort(
      (a, b) =>
        new Date(b.publicadoEn).getTime() - new Date(a.publicadoEn).getTime(),
    );
}

async function getCmsCirculares(): Promise<Circular[]> {
  const entries = await getCollection("circulares");
  return entries
    .map(toCircular)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
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
        "[db] No se pudieron leer noticias de Supabase. Se intentará Content Collections.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  try {
    const cms = await getCmsNoticias();
    if (cms.length > 0) {
      noticiasCache = cms;
      return noticiasCache;
    }
  } catch (error) {
    console.warn(
      "[db] No se pudieron leer noticias de Content Collections. Usando fallback local.",
      error instanceof Error ? error.message : error,
    );
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
        "[db] No se pudieron leer circulares de Supabase. Se intentará Content Collections.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  try {
    const cms = await getCmsCirculares();
    if (cms.length > 0) {
      circularesCache = cms;
      return circularesCache;
    }
  } catch (error) {
    console.warn(
      "[db] No se pudieron leer circulares de Content Collections. Usando fallback local.",
      error instanceof Error ? error.message : error,
    );
  }

  circularesCache = fallbackCirculares();
  return circularesCache;
}
