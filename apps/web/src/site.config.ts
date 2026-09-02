import { z } from "astro/zod";

/**
 * White-label configuration — single source of truth for the school brand.
 *
 * Este archivo es un CARGADOR multi-colegio:
 *  - Define el schema (zod) que valida la config de cada colegio.
 *  - Carga todas las configs de `./configs/*.ts` (una por colegio).
 *  - Selecciona la config según la env var `PUBLIC_SITE_SLUG`.
 *  - Si el slug no está definido o no existe su config, usa `colegio-piloto`.
 *
 * Los componentes importan `siteConfig` (mismo símbolo de siempre), por lo
 * que los imports existentes siguen funcionando sin cambios.
 *
 * Colegios nuevos → `apps/web/src/configs/<slug>.ts` + assets en
 * `public/branding/<slug>/`. La selección ocurre en build-time (SSG puro).
 */

const hexColorSchema = z
  .string()
  .regex(
    /^#[0-9a-fA-F]{6}$/,
    "El color debe ser HEX de 6 dígitos en mayúsculas o minúsculas (#RRGGBB)",
  );

const assetPathSchema = z
  .string()
  .startsWith("/branding/", "Los assets de marca deben vivir en /branding/");

const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9-]+$/,
    "El slug solo puede contener minúsculas, números y guiones",
  );

const socialSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  youtube: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  x: z.string().url().optional(),
  tiktok: z.string().url().optional(),
});

const contactSchema = z.object({
  address: z.string().min(5, "La dirección es demasiado corta"),
  city: z.string().min(2, "La ciudad es demasiado corta"),
  phone: z.string().min(7, "El teléfono es demasiado corto"),
  whatsapp: z.string().min(7, "El número de WhatsApp es demasiado corto"),
  email: z.string().email("El email de contacto no es válido"),
  mapUrl: z.string().url().optional(),
  mapEmbedUrl: z.string().url().optional(),
  officeHours: z.string().min(5, "El horario de atención es demasiado corto"),
});

const levelSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z
    .string()
    .min(2)
    .max(40, "El nombre del nivel no puede superar 40 caracteres"),
  shortName: z
    .string()
    .min(2)
    .max(20, "La abreviatura no puede superar 20 caracteres"),
  slug: slugSchema,
  description: z.string().max(280).optional(),
  ageRange: z.string().optional(),
  enabled: z.boolean().default(true),
});

const sectionsSchema = z.object({
  hero: z.boolean().default(true),
  about: z.boolean().default(true),
  levels: z.boolean().default(true),
  admissions: z.boolean().default(true),
  news: z.boolean().default(true),
  testimonials: z.boolean().default(true),
  gallery: z.boolean().default(true),
  contact: z.boolean().default(true),
});

const admissionsSchema = z.object({
  active: z.boolean().default(true),
  periodLabel: z.string().min(2),
  ctaLabel: z.string().min(2),
  ctaUrl: z.string().min(1),
  deadline: z.string().optional(),
  requirements: z.array(z.string()).default([]),
});

const brandingSchema = z.object({
  colors: z.object({
    primary: hexColorSchema,
    primaryHover: hexColorSchema,
    primaryActive: hexColorSchema,
    primarySoft: hexColorSchema,
    accent: hexColorSchema,
    accentSoft: hexColorSchema,
    surface: hexColorSchema,
    surfaceMuted: hexColorSchema,
    surfaceStrong: hexColorSchema,
    surfaceInverse: hexColorSchema,
    text: hexColorSchema,
    textMuted: hexColorSchema,
    textSubtle: hexColorSchema,
    textInverse: hexColorSchema,
    border: hexColorSchema,
    borderStrong: hexColorSchema,
    success: hexColorSchema,
    warning: hexColorSchema,
    danger: hexColorSchema,
    info: hexColorSchema,
  }),
  fonts: z.object({
    sans: z.string().min(1),
    display: z.string().min(1),
    mono: z.string().min(1),
  }),
  radius: z.object({
    xs: z.string().min(1),
    sm: z.string().min(1),
    md: z.string().min(1),
    lg: z.string().min(1),
    xl: z.string().min(1),
    full: z.string().min(1),
  }),
  assets: z.object({
    logo: assetPathSchema.optional(),
    logoInverse: assetPathSchema.optional(),
    favicon: assetPathSchema.optional(),
    ogImage: assetPathSchema,
    tourVideoPoster: assetPathSchema.optional(),
    heroPhoto: assetPathSchema.optional(),
  }),
});

const seoSchema = z.object({
  titleTemplate: z.string().min(1),
  defaultTitle: z
    .string()
    .min(1)
    .max(60, "El título por defecto no puede superar 60 caracteres"),
  defaultDescription: z
    .string()
    .min(1)
    .max(160, "La meta descripción no puede superar 160 caracteres"),
  keywords: z.array(z.string()).default([]),
  author: z.string().min(1),
  siteUrl: z.string().url(),
  ogImage: assetPathSchema,
  twitterHandle: z.string().startsWith("@").optional(),
});

const supabaseSchema = z.object({
  url: z.string().url(),
  anonKeyEnvName: z.string().min(1).default("PUBLIC_SUPABASE_ANON_KEY"),
  serviceKeyEnvName: z.string().min(1).default("SUPABASE_SERVICE_ROLE_KEY"),
});

export const siteConfigSchema = z.object({
  identity: z.object({
    name: z
      .string()
      .min(2)
      .max(40, "El nombre de la institución no puede superar 40 caracteres"),
    slogan: z.string().min(2).max(80, "El lema no puede superar 80 caracteres"),
    shortDescription: z.string().max(160).optional(),
    description: z.string().max(500).optional(),
    founded: z.number().int().min(1900).max(2100).optional(),
  }),
  contact: contactSchema,
  social: socialSchema,
  levels: z
    .array(levelSchema)
    .min(1, "Debe existir al menos un nivel educativo"),
  sections: sectionsSchema,
  admissions: admissionsSchema,
  branding: brandingSchema,
  seo: seoSchema,
  supabase: supabaseSchema,
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;

/* ------------------------------------------------------------------ */
/* Cargador multi-colegio                                              */
/* ------------------------------------------------------------------ */

const DEFAULT_SLUG = "colegio-piloto";

/**
 * Carga eager de todas las configs de colegio en `./configs/*.ts`.
 * Cada módulo exporta por defecto un objeto plano (sin schema).
 */
const configModules = import.meta.glob<{ default: unknown }>("./configs/*.ts", {
  eager: true,
});

/** Slug activo: env var PUBLIC_SITE_SLUG, o fallback al piloto. */
function resolveActiveSlug(): string {
  const envSlug = import.meta.env.PUBLIC_SITE_SLUG;
  if (envSlug && configModules[`./configs/${envSlug}.ts`]) {
    return envSlug;
  }
  if (envSlug) {
    console.warn(
      `[site.config] No existe config para PUBLIC_SITE_SLUG="${envSlug}". ` +
        `Usando fallback "${DEFAULT_SLUG}".`,
    );
  }
  return DEFAULT_SLUG;
}

const activeSlug = resolveActiveSlug();
const activeModule = configModules[`./configs/${activeSlug}.ts`];

if (!activeModule) {
  throw new Error(
    `[site.config] No se encontró la config "${activeSlug}" en ./configs/. ` +
      `Crea apps/web/src/configs/${activeSlug}.ts`,
  );
}

/** Config del colegio activo, validada contra el schema. */
export const siteConfig = siteConfigSchema.parse(activeModule.default);

/** Slug del colegio activo (útil para logs y assets). */
export const siteSlug = activeSlug;
