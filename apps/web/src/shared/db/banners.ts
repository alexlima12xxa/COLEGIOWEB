import { getDbContext } from "./client";
import { ensureAccessibleImage } from "./imageAccess";
import { bannerSchema, bannersFallbackSchema } from "./schema";
import type { Banner } from "./schema";
import bannersFallbackData from "../../data/fallback/banners.json";

/**
 * Repositorio de banners del hero (tabla `banners`).
 *
 * Supabase es la ÚNICA fuente. Si no está configurada (service role + tenant,
 * build-time) o no devuelve banners activos, se usa el fallback JSON versionado
 * (src/data/fallback/banners.json). Las consultas nunca lanzan: se registra un
 * warning y se degrada al fallback (criterio de aceptación).
 *
 * Los banners se ordenan por `orden` y se filtran por `activo`. Cada fila se
 * valida contra el MISMO zod que el fallback; los assets de Storage se
 * resuelven y, si son inaccesibles, se sustituyen por un placeholder local.
 */

/**
 * Resultado de la consulta. `fromDb` indica si los datos provienen de Supabase
 * (con BD configurada). La web lo usa para decidir entre slider de banners
 * reales y el HomeHero de fallback: si hay BD pero no hay banners activos, se
 * devuelve lista vacía (NO el fallback de prueba) para caer al hero.
 */
export interface BannersResult {
  banners: Banner[];
  fromDb: boolean;
}

function fallbackBanners(): Banner[] {
  return bannersFallbackSchema.parse(bannersFallbackData).items;
}

let bannersCache: BannersResult | undefined;

export async function getBanners(): Promise<BannersResult> {
  if (bannersCache) return bannersCache;

  const context = getDbContext();
  if (context) {
    try {
      const { data, error } = await context.client
        .from("banners")
        .select("id, plantillaId:plantilla_id, orden, activo, datos")
        .eq("tenant_id", context.config.tenantId)
        .eq("activo", true)
        .order("orden", { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        // Parse fila por fila: una fila inválida no descarta el resto.
        const parsed: Banner[] = [];
        for (const row of data) {
          const result = bannerSchema.safeParse(row);
          if (!result.success) continue;
          const datos = result.data.datos;
          const background = await ensureAccessibleImage(datos.background);
          const image = await ensureAccessibleImage(datos.image);
          const assets = await Promise.all(
            datos.assets.map(async (a) => ({
              ...a,
              src: (await ensureAccessibleImage(a.src)) ?? a.src,
            })),
          );
          parsed.push({
            ...result.data,
            datos: {
              ...datos,
              background: background ?? datos.background,
              image: image ?? datos.image,
              assets,
            },
          });
        }

        if (parsed.length > 0) {
          bannersCache = { banners: parsed, fromDb: true };
          return bannersCache;
        }
      }

      // BD configurada pero sin banners activos → lista vacía (cae al hero).
      bannersCache = { banners: [], fromDb: true };
      return bannersCache;
    } catch (error) {
      console.warn(
        "[db] No se pudieron leer banners de Supabase. Usando fallback local.",
        error instanceof Error ? error.message : error,
      );
    }
  }

  // Sin BD configurada (dev/local): se sirve el fallback de prueba para que el
  // slider sea visible durante el desarrollo. Se resuelve sólo si parsed ok.
  bannersCache = { banners: fallbackBanners(), fromDb: false };
  return bannersCache;
}
