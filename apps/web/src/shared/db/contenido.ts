import { getDbContext } from "./client";
import { resolveAssetUrl } from "./storage";
import { siteConfig } from "../../site.config";
import {
  admisionesSchema,
  autoridadSchema,
  contactoSchema,
  footerSchema,
  galeriaItemSchema,
  heroSchema,
  hitoSchema,
  metricaSchema,
  navbarSchema,
  nivelesSchema,
  nosotrosHeroSchema,
  pilarSchema,
  pilaresSchema,
  videoTourSchema,
  whatsappSchema,
} from "./schema";
import type {
  Admisiones,
  Autoridad,
  Contacto,
  Footer,
  GaleriaItem,
  Hito,
  Metrica,
  NavbarLink,
  Niveles,
  NosotrosHero,
  Pilar,
  Pilares,
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
 *   navbar      → {links: [{label, href}]}
 *   metricas    → [{value, label}]
 *   pilares     → {titulo, items: [{title, description, metric}]}
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

// ── Hero de Nosotros (clave `nosotros_hero`) ──────────────────────────────
// Título, texto introductorio e imagen del hero de la página /nosotros.
// Fallback: valores hardcodeados en nosotros.astro.

const NOSOTROS_HERO_FALLBACK: NosotrosHero = {
  title: "Nuestra historia",
  lead: "Desde 1985 construimos una comunidad de aprendizaje centrada en las personas.",
  description:
    "Somos una institución educativa con décadas de trayectoria formando estudiantes íntegros, críticos y preparados para los desafíos del mundo actual.",
  image: "/branding/placeholders/about-campus.jpg",
};

export async function getNosotrosHero(): Promise<NosotrosHero> {
  const raw = await getContenido<unknown>("nosotros_hero", () => undefined);
  const parsed = nosotrosHeroSchema.safeParse(raw);
  if (!parsed.success) return NOSOTROS_HERO_FALLBACK;
  const image = await ensureAccessibleImage(parsed.data.image);
  return { ...parsed.data, image: image ?? NOSOTROS_HERO_FALLBACK.image };
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

// ── Navbar (clave `navbar`) ─────────────────────────────────────────────────
// {links: [{label, href}]}. Fallback: enlaces actuales de Navbar.astro.

const NAVBAR_FALLBACK: NavbarLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Niveles", href: "/niveles" },
  { label: "Admisiones", href: "/admisiones" },
  { label: "Noticias", href: "/noticias" },
  { label: "Circulares", href: "/circulares" },
  { label: "Contacto", href: "/contacto" },
];

export async function getNavbar(): Promise<NavbarLink[]> {
  const raw = await getContenido<unknown>("navbar", () => undefined);
  const parsed = navbarSchema.safeParse(raw);
  if (parsed.success && parsed.data.links.length > 0) {
    return parsed.data.links;
  }
  return NAVBAR_FALLBACK;
}

// ── Métricas (clave `metricas`) ─────────────────────────────────────────────
// [{value, label}] franja de datos de la portada. Fallback home.metrics.

export async function getMetricas(): Promise<Metrica[]> {
  const raw = await getContenido<unknown[]>("metricas", () => homeData.metrics);
  if (!Array.isArray(raw)) return homeData.metrics;
  const parsed = raw
    .map((item) => metricaSchema.safeParse(item))
    .filter((r): r is { success: true; data: Metrica } => r.success)
    .map((r) => r.data);
  return parsed.length > 0 ? parsed : homeData.metrics;
}

// ── Pilares en acción (clave `pilares`) ─────────────────────────────────────
// {titulo, items}. Fallback: título fijo + home.pillarsEnAccion.

function fallbackPilares(): Pilares {
  return {
    titulo: "Nuestros Pilares en Acción",
    items: homeData.pillarsEnAccion,
  };
}

export async function getPilares(): Promise<Pilares> {
  const raw = await getContenido<unknown>("pilares", () => fallbackPilares());
  const parsed = pilaresSchema.safeParse(raw);
  if (!parsed.success || parsed.data.items.length === 0) {
    return fallbackPilares();
  }
  return parsed.data;
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

// Resumen de niveles para tarjetas / footer / sitemap (clave `niveles`).
// Devuelve los campos de tarjeta de cada nivel en el orden del config del
// colegio (siteConfig.levels). Si la clave no existe o no valida, usa el
// orden y las etiquetas del config estático como fallback.

export interface NivelResumen {
  id: string;
  slug: string;
  name: string;
  ageRange?: string;
  subtitle?: string;
  subtitleVisible: boolean;
  image?: string;
  enabled: boolean;
  description: string;
}

export async function getNivelesResumen(): Promise<NivelResumen[]> {
  const niveles = await getNiveles();

  // Orden y slugs canónicos desde el config estático (SSG: rutas fijas).
  return siteConfig.levels.map((cfg) => {
    const detalle = niveles[cfg.slug];
    const image = detalle ? detalle.image : cfg.image;
    return {
      id: cfg.slug,
      slug: cfg.slug,
      name: detalle?.name && detalle.name.trim() ? detalle.name : cfg.name,
      ageRange: detalle?.ageRange ?? cfg.ageRange,
      subtitle: detalle?.subtitle ?? cfg.subtitle,
      subtitleVisible: detalle?.subtitleVisible ?? false,
      image,
      enabled: detalle?.enabled ?? cfg.enabled,
      description: detalle ? detalle.description : (cfg.description ?? ""),
    };
  });
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
// {info:{mapUrl?,mapEmbedUrl?}, departments[], formFields[]}. Fallback
// contact.json. La dirección/teléfono/email/horario generales viven en la
// clave `footer` (ver getFooter).

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

// ── WhatsApp (clave `whatsapp`) ─────────────────────────────────────────────
// {numero} en E.164. Si la clave no existe o es inválida, se devuelve `{}` y
// el consumidor aplica el fallback a siteConfig.contact.whatsapp.

export async function getWhatsapp(): Promise<{ numero?: string }> {
  const raw = await getContenido<unknown>("whatsapp", () => undefined);
  const parsed = whatsappSchema.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

// ── Footer (clave `footer`) ─────────────────────────────────────────────────
// Datos del pie de página: contacto general (dirección, ciudad, teléfono,
// email, horario), títulos de columna editables, redes sociales y bloques de
// nivel con enlaces.
//
// Fallback: se construye desde siteConfig (config por colegio), no de un JSON
// estático, porque estos valores son los mismos que hoy muestra el footer y
// deben respetar el colegio activo. Los bloques de nivel del footer son
// INDEPENDIENTES de la clave `niveles` (las tarjetas del inicio no se ven
// afectadas).

function buildFooterBase(): Footer {
  return {
    contact: {
      address: siteConfig.contact.address,
      city: siteConfig.contact.city,
      phone: siteConfig.contact.phone,
      email: siteConfig.contact.email,
      officeHours: siteConfig.contact.officeHours,
    },
    contactTitle: "Contacto",
    levelsTitle: "Niveles educativos",
    socialTitle: "Síguenos",
    social: { ...siteConfig.social },
    levels: siteConfig.levels
      .filter((l) => l.enabled)
      .map((l) => ({
        name: l.name,
        href: `/niveles/${l.slug}`,
      })),
  };
}

// Base constante de módulo: permite saber si el valor vino de la BD o del
// fallback (getContenido devuelve este mismo objeto cuando no hay clave).
const FOOTER_BASE: Footer = buildFooterBase();

export async function getFooter(): Promise<Footer> {
  const raw = await getContenido<unknown>("footer", FOOTER_BASE);
  const fromFallback = raw === FOOTER_BASE;

  const parsed = footerSchema.safeParse(raw);
  if (!parsed.success) return FOOTER_BASE;

  const data = parsed.data;
  if (fromFallback) return data;

  // La clave existe en BD: la BD manda, pero los campos ausentes se completan
  // con el config del colegio (p. ej. una ciudad dejada en blanco).
  return {
    ...data,
    contact: { ...FOOTER_BASE.contact, ...data.contact },
    contactTitle: data.contactTitle || FOOTER_BASE.contactTitle,
    levelsTitle: data.levelsTitle || FOOTER_BASE.levelsTitle,
    socialTitle: data.socialTitle || FOOTER_BASE.socialTitle,
    social: data.social,
    levels: data.levels.length > 0 ? data.levels : FOOTER_BASE.levels,
  };
}
