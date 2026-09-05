import { getDbContext } from "./client";
import { resolveAssetUrl } from "./storage";
import {
  admisionesSchema,
  autoridadSchema,
  contactoSchema,
  galeriaItemSchema,
  heroSchema,
  hitoSchema,
  nivelesSchema,
  pilarSchema,
  videoTourSchema,
} from "./schema";
import type {
  Admisiones,
  Autoridad,
  Contacto,
  GaleriaItem,
  Hito,
  Niveles,
  Pilar,
} from "./schema";
import type { z } from "astro/zod";
import aboutData from "../../data/fallback/about.json";
import homeData from "../../data/fallback/home.json";
import levelsData from "../../data/fallback/levels.json";
import admissionsData from "../../data/fallback/admissions.json";
import contactData from "../../data/fallback/contact.json";

/**
 * Repositorio del contenido editorial por clave (tabla `contenido`).
 *
 * La web es SSG: lee estas claves SOLO en build-time con la service role key.
 * Cada clave se valida con su zod. Si la BD no está configurada, devuelve
 * error, o el dato no pasa la validación, se usa el fallback JSON versionado.
 *
 * Contrato de claves (ver README en la migración 20260901000000_contenido.sql):
 *   mision      → string
 *   vision      → string
 *   filosofia   → [{title, description}]
 *   historia    → [{title, date, description}]
 *   hero        → {badge?, name, slogan, description, heroPhoto, tourPoster, actions?}
 *   video_tour  → {videoUrl, poster, title, description}
 */

type Hero = z.infer<typeof heroSchema>;
type VideoTour = z.infer<typeof videoTourSchema>;

const cache = new Map<string, unknown>();

// Placeholder local para imágenes de Storage inaccesibles (no romper build).
const IMAGE_FALLBACK = "/branding/placeholders/gallery-1.jpg";
const imageAccessCache = new Map<string, boolean>();

async function isImageAccessible(url: string): Promise<boolean> {
  const cached = imageAccessCache.get(url);
  if (cached !== undefined) return cached;
  let accessible: boolean;
  try {
    const res = await fetch(url, { method: "HEAD" });
    accessible = res.status >= 200 && res.status < 300;
  } catch {
    accessible = false;
  }
  imageAccessCache.set(url, accessible);
  return accessible;
}

// Sustituye una imagen de Storage inaccesible por un placeholder local.
async function ensureAccessibleImage(
  path?: string,
): Promise<string | undefined> {
  if (!path) return undefined;
  if (path.startsWith("/") || /^https?:\/\//i.test(path)) return path;
  const resolved = resolveAssetUrl(path);
  if (!resolved) return path;
  const accessible = await isImageAccessible(resolved);
  return accessible ? path : IMAGE_FALLBACK;
}

/** Lee una clave de la tabla `contenido` del tenant. Nunca lanza. */
async function readClave<T>(clave: string): Promise<T | undefined> {
  const context = getDbContext();
  if (!context) return undefined;
  try {
    const { data, error } = await context.client
      .from("contenido")
      .select("valor")
      .eq("tenant_id", context.config.tenantId)
      .eq("clave", clave)
      .maybeSingle();
    if (error || !data) return undefined;
    return data.valor as T;
  } catch (error) {
    console.warn(
      `[db] No se pudo leer la clave "${clave}" de Supabase. Usando fallback local.`,
      error instanceof Error ? error.message : error,
    );
    return undefined;
  }
}

async function getCached<T>(clave: string, fallback: () => T): Promise<T> {
  if (cache.has(clave)) return cache.get(clave) as T;
  const value = await readClave<T>(clave);
  const result = value !== undefined ? value : fallback();
  cache.set(clave, result);
  return result;
}

/**
 * API pública genérica de contenido editorial.
 *
 * Lee la clave `clave` de la tabla `contenido` del tenant (build-time, service
 * role key). Si la BD no está configurada, la clave no existe, o el valor no
 * pasa la validación del getter que la consume, se devuelve `fallback` (los
 * JSON versionados de src/data/fallback). Nunca lanza.
 */
export async function getContenido<T>(
  clave: string,
  fallback: T | (() => T),
): Promise<T> {
  const resolveFallback =
    typeof fallback === "function" ? (fallback as () => T) : () => fallback;
  return getCached<T>(clave, resolveFallback);
}

export async function getMision(): Promise<string> {
  const raw = await getContenido<string>("mision", () => aboutData.mission);
  return typeof raw === "string" && raw.trim() ? raw : aboutData.mission;
}

export async function getVision(): Promise<string> {
  const raw = await getContenido<string>("vision", () => aboutData.vision);
  return typeof raw === "string" && raw.trim() ? raw : aboutData.vision;
}

export async function getFilosofia(): Promise<Pilar[]> {
  const raw = await getContenido<unknown[]>(
    "filosofia",
    () => aboutData.philosophy,
  );
  if (!Array.isArray(raw)) return aboutData.philosophy;
  const parsed = raw
    .map((item) => pilarSchema.safeParse(item))
    .filter((r): r is { success: true; data: Pilar } => r.success)
    .map((r) => r.data);
  return parsed.length > 0 ? parsed : aboutData.philosophy;
}

export async function getHistoria(): Promise<Hito[]> {
  const raw = await getContenido<unknown[]>(
    "historia",
    () => aboutData.history,
  );
  if (!Array.isArray(raw)) return aboutData.history;
  const parsed = raw
    .map((item) => hitoSchema.safeParse(item))
    .filter((r): r is { success: true; data: Hito } => r.success)
    .map((r) => r.data);
  return parsed.length > 0 ? parsed : aboutData.history;
}

export async function getHero(): Promise<{ data: Hero; isFromDb: boolean }> {
  const raw = await getContenido<unknown>("hero", () => undefined);
  const parsed = heroSchema.safeParse(raw);
  const data: Hero = parsed.success ? parsed.data : {};

  // Resuelve la foto del hero: si es de Storage y accesible, se sirve remota
  // (astro:assets → AVIF/WebP). Si no, placeholder local.
  const heroPhoto = await ensureAccessibleImage(data.heroPhoto);
  const tourPoster = await ensureAccessibleImage(data.tourPoster);

  return {
    data: { ...data, heroPhoto, tourPoster },
    isFromDb: parsed.success && Boolean(data.heroPhoto || data.name),
  };
}

export async function getVideoTour(): Promise<{
  data: Partial<VideoTour>;
  isFromDb: boolean;
}> {
  const raw = await getContenido<unknown>("video_tour", () => undefined);
  const parsed = videoTourSchema.safeParse(raw);
  const data: Partial<VideoTour> = parsed.success ? parsed.data : {};
  const poster = await ensureAccessibleImage(data.poster);
  return {
    data: { ...data, poster },
    isFromDb: parsed.success && Boolean(data.videoUrl),
  };
}

// ── Autoridades (clave `autoridades`) ───────────────────────────────────────
// Array [{name, role, image}] directivos. Fallback about.authorities.

export async function getAutoridades(): Promise<Autoridad[]> {
  const raw = await getContenido<unknown[]>(
    "autoridades",
    () => aboutData.authorities,
  );
  if (!Array.isArray(raw)) return aboutData.authorities;
  const parsed = raw
    .map((item) => autoridadSchema.safeParse(item))
    .filter((r): r is { success: true; data: Autoridad } => r.success)
    .map((r) => r.data);
  if (parsed.length === 0) return aboutData.authorities;
  // Resuelve imágenes de Storage inaccesibles a placeholder local.
  const withImages = await Promise.all(
    parsed.map(async (a) => ({
      ...a,
      image: (await ensureAccessibleImage(a.image)) ?? a.image,
    })),
  );
  return withImages;
}

// ── Galería (clave `galeria`) ───────────────────────────────────────────────
// Array [{src, alt, variant}] de la galería bento. Fallback home.bentoGallery.

function fallbackGaleria(): GaleriaItem[] {
  const parsed = homeData.bentoGallery
    .map((item) => galeriaItemSchema.safeParse(item))
    .filter((r): r is { success: true; data: GaleriaItem } => r.success)
    .map((r) => r.data);
  // El fallback es estático y válido; el cast solo cubre un fallback corrupto.
  return parsed.length > 0 ? parsed : (homeData.bentoGallery as GaleriaItem[]);
}

export async function getGaleria(): Promise<GaleriaItem[]> {
  const raw = await getContenido<unknown[]>("galeria", () => fallbackGaleria());
  if (!Array.isArray(raw)) return fallbackGaleria();
  const parsed = raw
    .map((item) => galeriaItemSchema.safeParse(item))
    .filter((r): r is { success: true; data: GaleriaItem } => r.success)
    .map((r) => r.data);
  if (parsed.length === 0) return fallbackGaleria();
  const withImages = await Promise.all(
    parsed.map(async (g) => ({
      ...g,
      src: (await ensureAccessibleImage(g.src)) ?? g.src,
    })),
  );
  return withImages;
}

// ── Niveles (clave `niveles`) ───────────────────────────────────────────────
// Objeto {preescolar, primaria, secundaria} con el detalle de
// cada nivel. Fallback levels.json.

export async function getNiveles(): Promise<Niveles> {
  const raw = await getContenido<unknown>("niveles", () => levelsData);
  const parsed = nivelesSchema.safeParse(raw);
  if (!parsed.success) return levelsData;
  // Resuelve imágenes de Storage inaccesibles a placeholder local.
  const entries = await Promise.all(
    Object.entries(parsed.data).map(async ([slug, detalle]) => {
      const image =
        (await ensureAccessibleImage(detalle.image)) ?? detalle.image;
      return [slug, { ...detalle, image }] as const;
    }),
  );
  return Object.fromEntries(entries) as Niveles;
}

// ── Admisiones (clave `admisiones`) ─────────────────────────────────────────
// {schedule[], requirements[], faq[]}. Fallback admissions.json.

export async function getAdmisiones(): Promise<Admisiones> {
  const raw = await getContenido<unknown>("admisiones", () => admissionsData);
  const parsed = admisionesSchema.safeParse(raw);
  if (!parsed.success) return admissionsData as Admisiones;
  return parsed.data;
}

// ── Contacto (clave `contacto`) ─────────────────────────────────────────────
// {departments[], formFields[]}. Fallback contact.json.

function fallbackContacto(): Contacto {
  const parsed = contactoSchema.safeParse(contactData);
  // El fallback es estático y válido; el cast solo cubre un fallback corrupto.
  return parsed.success ? parsed.data : (contactData as Contacto);
}

export async function getContacto(): Promise<Contacto> {
  const raw = await getContenido<unknown>("contacto", () => fallbackContacto());
  const parsed = contactoSchema.safeParse(raw);
  if (!parsed.success) return fallbackContacto();
  return parsed.data;
}
