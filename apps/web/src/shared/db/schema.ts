import { z } from "astro/zod";
import { BANNERS_SLUGS } from "@web-modelo/shared";

/**
 * Contrato de datos compartido (GATE 4).
 *
 * Las tablas de Supabase (supabase/migrations/20260828000000_init.sql) y los
 * fallbacks JSON de src/data/fallback/ usan EXACTAMENTE estos esquemas:
 *  - La Data API devuelve columnas con alias camelCase (imagen_path → imagenPath)
 *    mediante la cláusula `select` de PostgREST.
 *  - Los fallbacks versionados ({"version": 1, "items": [...]}) se validan con
 *    los mismos esquemas antes de usarse en build.
 *
 * Si cambia una tabla, cambia este archivo Y se incrementa el `version` de los
 * fallbacks afectados.
 */

export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug inválido: solo minúsculas, números y guiones",
  );

/** Acepta null (columnas nullable de Postgres) y undefined (fallback JSON). */
const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

/**
 * ISO 8601 datetime con zona horaria. PostgREST serializa timestamptz como
 * "2026-08-18T09:00:00+00:00" (offset), que z.iso.datetime() de zod v4
 * rechaza (solo admite "Z").
 */
const isoDatetimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    "Fecha ISO 8601 con zona horaria inválida",
  );

export const colegioSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
  nombre: z.string().min(1),
  slogan: nullableString,
  activo: z.boolean().default(true),
});

export type Colegio = z.infer<typeof colegioSchema>;

export const noticiaSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
  titulo: z.string().min(1).max(200),
  resumen: nullableString,
  contenido: z.string().min(1),
  imagenPath: nullableString,
  imagenAlt: z.string().default(""),
  autor: nullableString,
  publicadoEn: isoDatetimeSchema,
});

export type Noticia = z.infer<typeof noticiaSchema>;

export const noticiasFallbackSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(noticiaSchema),
});

export const circularSchema = z.object({
  id: z.uuid(),
  titulo: z.string().min(1).max(200),
  descripcion: nullableString,
  categoria: nullableString,
  fecha: z.iso.date(),
  archivoPath: nullableString,
  archivoNombre: nullableString,
  publicadoEn: isoDatetimeSchema.optional(),
});

export type Circular = z.infer<typeof circularSchema>;

export const circularesFallbackSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(circularSchema),
});

export const leadSchema = z.object({
  id: z.uuid().optional(),
  tenantId: z.uuid().optional(),
  nombre: z.string().min(2).max(120),
  email: z.email(),
  telefono: nullableString,
  nivelInteres: nullableString,
  mensaje: nullableString,
  origen: z.string().default("web"),
  estado: z.string().default("nuevo"),
  createdAt: isoDatetimeSchema.optional(),
});

export type Lead = z.infer<typeof leadSchema>;

// ── Contenido editorial (tabla `contenido`, clave → valor JSONB) ────────────
// Estas claves las edita el director desde el panel admin. La web las lee en
// build-time con la service role key y las valida con estos esquemas, cayendo
// a los fallbacks JSON si no hay dato válido. Mantener en sincronía con el
// README de claves de supabase/migrations/20260901000000_contenido.sql.

export const pilarSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().min(10).max(500),
});

export type Pilar = z.infer<typeof pilarSchema>;

export const hitoSchema = z.object({
  title: z.string().min(3).max(120),
  date: z.string().min(1).max(10),
  description: z.string().min(10).max(1000),
});

export type Hito = z.infer<typeof hitoSchema>;

// ── Hero de Nosotros (clave `nosotros_hero`) ──────────────────────────────
// Título, texto introductorio e imagen del hero de la página /nosotros.
// Fallback: valores hardcodeados en nosotros.astro.

export const nosotrosHeroSchema = z.object({
  title: z.string().min(2).max(100).default("Nuestra historia"),
  lead: z.string().min(10).max(300).default(""),
  description: z.string().max(500).default(""),
  image: z.string().min(1).default("/branding/placeholders/about-campus.jpg"),
});

export type NosotrosHero = z.infer<typeof nosotrosHeroSchema>;

export const heroSchema = z.object({
  badge: z.string().optional(),
  name: z.string().min(2).max(80).optional(),
  slogan: z.string().min(2).max(200).optional(),
  description: z.string().max(500).optional(),
  heroPhoto: z.string().optional(),
  tourPoster: z.string().optional(),
  actions: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        variant: z.string().optional(),
      }),
    )
    .optional(),
});

export const videoTourSchema = z.object({
  videoUrl: z.string().min(1).max(500),
  poster: z.string().optional(),
  title: z.string().optional(),
  description: z.string().max(500).optional(),
});

// ── Navbar (clave `navbar`) ─────────────────────────────────────────────────
// {links: [{label, href}]} enlaces de la navegación principal. Logo y nombre
// del colegio siguen en site.config (por colegio). Fallback: enlaces actuales.

export const navbarLinkSchema = z.object({
  label: z.string().min(1).max(60),
  href: z.string().min(1).max(200),
});

export type NavbarLink = z.infer<typeof navbarLinkSchema>;

export const navbarSchema = z.object({
  links: z.array(navbarLinkSchema).default([]),
});

export type Navbar = z.infer<typeof navbarSchema>;

// ── Métricas (clave `metricas`) ─────────────────────────────────────────────
// [{value, label}] franja de datos de la portada (4 fijos). Fallback home.metrics.

export const metricaSchema = z.object({
  value: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
});

export type Metrica = z.infer<typeof metricaSchema>;

// ── Pilares en acción (clave `pilares`) ─────────────────────────────────────
// {titulo, items: [{title, description, metric, image?, imageAlt?}]}.
// Fallback: título "Nuestros Pilares en Acción" + home.pillarsEnAccion.

export const pilarEnAccionSchema = z.object({
  title: z.string().min(3).max(80),
  description: z.string().min(10).max(500),
  metric: z.string().min(1).max(120),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
});

export type PilarEnAccion = z.infer<typeof pilarEnAccionSchema>;

export const pilaresSchema = z.object({
  titulo: z.string().min(1).max(120),
  items: z.array(pilarEnAccionSchema).default([]),
});

export type Pilares = z.infer<typeof pilaresSchema>;

// ── Autoridades (clave `autoridades`) ───────────────────────────────────────
// Array [{name, role, image}] directivos del colegio. Fallback about.authorities.

export const autoridadSchema = z.object({
  name: z.string().min(2).max(120),
  role: z.string().min(2).max(120),
  image: z.string().min(1),
});

export type Autoridad = z.infer<typeof autoridadSchema>;

// ── Galería (clave `galeria`) ───────────────────────────────────────────────
// Array [{src, alt, variant}] de la galería bento de la portada.
// Fallback home.bentoGallery. variant controla el tamaño en el bento grid.

export const galeriaItemSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1).max(200),
  variant: z.enum(["large", "tall", "wide", "default"]).default("default"),
});

export type GaleriaItem = z.infer<typeof galeriaItemSchema>;

// ── Detalle de nivel educativo (clave `niveles`) ────────────────────────────
// Objeto con una entrada por nivel: {preescolar, primaria, secundaria}.
// Cada entrada alimenta NivelLayout. Fallback levels.json.

export const nivelDetalleSchema = z.object({
  // Tarjeta (resumen en el índice de niveles)
  name: z.string().min(2).max(40),
  ageRange: z.string().max(40).optional(),
  subtitle: z.string().max(120).optional(),
  subtitleVisible: z.boolean().default(false),
  enabled: z.boolean().default(true),
  // Detalle (página del nivel)
  headline: z.string().min(3).max(200),
  description: z.string().min(10).max(1000),
  image: z.string().min(1),
  program: z.array(z.string().min(1)).min(1),
  methodology: z.string().min(10).max(2000),
  schedule: z.object({
    mondayFriday: z.string().min(1).max(100),
    saturday: z.string().min(1).max(100),
  }),
  cta: z.string().min(3).max(160),
  ctaHref: z.string().default("/admisiones"),
});

export type NivelDetalle = z.infer<typeof nivelDetalleSchema>;

export const nivelesSchema = z.record(z.string(), nivelDetalleSchema);

export type Niveles = z.infer<typeof nivelesSchema>;

// ── Admisiones (clave `admisiones`) ─────────────────────────────────────────
// {fechasClave[], aviso?, etapas[], requisitosPorNivel{}, faq[]}.
// Fallback admissions.json.
//  - fechasClave alimenta la tarjeta Bento "Fechas Clave" del hero.
//  - etapas alimenta el stepper de 4 etapas.
//  - requisitosPorNivel alimenta las tabs de requisitos (una clave por nivel).
//  - faq alimenta el acordeón bento y el FAQ JSON-LD de la página.

export const admisionEstadoSchema = z.enum([
  "en-curso",
  "ultimos-cupos",
  "familias-admitidas",
]);

export const admisionFechaSchema = z.object({
  title: z.string().min(2).max(120),
  date: z.string().min(1).max(80),
  estado: admisionEstadoSchema.default("en-curso"),
  description: z.string().min(5).max(500).optional(),
});

export const admisionEtapaSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(5).max(500),
  pie: z.string().min(2).max(120),
});

export const admisionRequisitoSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().min(5).max(500),
  formato: z.string().min(2).max(120),
});

export const admisionFaqSchema = z.object({
  id: z.string().min(1).max(60),
  title: z.string().min(3).max(200),
  content: z.string().min(5).max(2000),
});

export const admisionesSchema = z.object({
  periodLabel: z.string().max(160).optional(),
  heroBadge: z.string().max(160).optional(),
  heroTitlePre: z.string().max(160).optional(),
  heroTitleHighlight: z.string().max(160).optional(),
  heroDescription: z.string().max(500).optional(),
  fechasClave: z.array(admisionFechaSchema).default([]),
  aviso: z.string().min(5).max(500).optional(),
  etapas: z.array(admisionEtapaSchema).default([]),
  requisitosPorNivel: z
    .record(z.string(), z.array(admisionRequisitoSchema).default([]))
    .default({}),
  faq: z.array(admisionFaqSchema).default([]),
});

export type Admisiones = z.infer<typeof admisionesSchema>;

// ── Banners del hero (tabla `banners`) ──────────────────────────────────────
// Slider de portada por tenant. Cada banner elige una plantilla (`plantilla_id`)
// y guarda en `datos` el payload visual de dicha plantilla. El shape de `datos`
// es flexible por diseño (textos, colores, assets, acciones), pero el contrato
// mínimo común está tipado abajo. Fallback: banners.json (src/data/fallback).

export const bannerAccionSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1),
  variant: z.enum(["primary", "secondary", "ghost"]).optional(),
});

export const bannerAssetSchema = z.object({
  src: z.string().min(1),
  alt: z.string().default(""),
});

export const bannerSchema = z.object({
  id: z.uuid().optional(),
  plantillaId: z.enum(BANNERS_SLUGS),
  orden: z.number().int().default(0),
  activo: z.boolean().default(true),
  datos: z
    .object({
      background: z.string().default(""),
      image: z.string().optional(),
      imageAlt: z.string().default(""),
      kicker: z.string().max(60).optional(),
      title: z.string().min(1).max(160),
      subtitle: z.string().max(300).optional(),
      // Clave del par/tono elegido (apunta a una opción controlada de la
      // paleta en packages/shared). Tipado/validado porque es común a todos.
      tono: z.string().default(""),
      cta: bannerAccionSchema.optional(),
      actions: z.array(bannerAccionSchema).default([]),
      assets: z.array(bannerAssetSchema).default([]),
    })
    .passthrough(),
});

export type Banner = z.infer<typeof bannerSchema>;
export type BannerAccion = z.infer<typeof bannerAccionSchema>;

export const bannersFallbackSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(bannerSchema),
});

// ── Contacto (clave `contacto`) ─────────────────────────────────────────────
// {info: {mapUrl?, mapEmbedUrl?}, departments[], formFields[]}.
// Fallback contact.json. departments alimenta el directorio; formFields genera
// el formulario; info solo guarda las URLs del mapa (el resto de datos de
// contacto vive en la clave `footer`).

export const contactoInfoSchema = z.object({
  mapUrl: z.string().optional(),
  mapEmbedUrl: z.string().optional(),
});

export const departamentoSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(7).max(40),
  email: z.string().email(),
  hours: z.string().min(2).max(160),
  hidden: z.boolean().default(false),
});

export const formFieldSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(2).max(120),
  type: z.enum(["text", "email", "tel", "textarea"]).default("text"),
  required: z.boolean().default(false),
});

export const contactoSchema = z.object({
  info: contactoInfoSchema.default({}),
  departments: z.array(departamentoSchema).default([]),
  formFields: z.array(formFieldSchema).default([]),
});

export type Contacto = z.infer<typeof contactoSchema>;

// ── WhatsApp (clave `whatsapp`) ─────────────────────────────────────────────
// {numero} en formato internacional E.164 (ej. +573101234567). Fallback a
// siteConfig.contact.whatsapp en el punto de uso.

export const whatsappSchema = z.object({
  numero: z
    .string()
    .regex(
      /^\+[1-9]\d{6,14}$/,
      "Número de WhatsApp en formato E.164 (ej. +573101234567)",
    ),
});

export type Whatsapp = z.infer<typeof whatsappSchema>;

// ── Footer (clave `footer`) ─────────────────────────────────────────────────
// Datos del pie de página: contacto general (dirección, ciudad, teléfono,
// email, horario), títulos editables, redes sociales y bloques de nivel con
// enlaces. Fallback footer.json.
// Los bloques de nivel son INDEPENDIENTES de la clave `niveles`: renombrar
// aquí un nivel NO afecta a las tarjetas del inicio (que leen `niveles`).

export const footerContactSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  officeHours: z.string().optional(),
});

export const footerSocialSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  youtube: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  x: z.string().url().optional(),
  tiktok: z.string().url().optional(),
});

export const footerNivelSchema = z.object({
  name: z.string().min(1).max(80),
  href: z.string().min(1),
});

export const footerSchema = z.object({
  contact: footerContactSchema.default({}),
  contactTitle: z.string().optional(),
  levelsTitle: z.string().optional(),
  socialTitle: z.string().optional(),
  social: footerSocialSchema.default({}),
  levels: z.array(footerNivelSchema).default([]),
});

export type Footer = z.infer<typeof footerSchema>;
