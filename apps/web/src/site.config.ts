import { z } from "astro/zod";

/**
 * White-label configuration — single source of truth for the school brand.
 *
 * Changing values here (colors, name, levels, contact, etc.) updates the
 * entire site without touching components, because UI components read CSS
 * custom properties generated from this config (see SEOHead.astro) and
 * import values from this file at build time.
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
    logo: assetPathSchema,
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

export const siteConfig = siteConfigSchema.parse({
  identity: {
    name: "Colegio Piloto",
    slogan: "Formando líderes para el futuro con excelencia académica",
    shortDescription:
      "Institución educativa comprometida con la excelencia académica y la formación integral.",
    description:
      "Somos una institución educativa con décadas de trayectoria formando estudiantes íntegros, críticos y preparados para los desafíos del mundo actual.",
    founded: 1985,
  },
  contact: {
    address: "Calle 123 # 45-67",
    city: "Bogotá, Colombia",
    phone: "+57 601 234 5678",
    whatsapp: "+573101234567",
    email: "contacto@colegiopiloto.edu.co",
    mapUrl: "https://maps.google.com/?q=Colegio+Piloto+Bogota",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.1234567890123!2d-74.08175!3d4.60971!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzYnMzUuMCJOIDc0wrAwNCw1NC4zIg!5e0!3m2!1ses!2sco!4v1600000000000",
    officeHours: "Lunes a viernes, 7:00 a.m. – 4:00 p.m.",
  },
  social: {
    facebook: "https://facebook.com/colegiopiloto",
    instagram: "https://instagram.com/colegiopiloto",
    youtube: "https://youtube.com/@colegiopiloto",
  },
  levels: [
    {
      id: "preescolar",
      name: "Preescolar",
      shortName: "Pre",
      slug: "preescolar",
      description: "Primera experiencia escolar con enfoque lúdico y afectivo.",
      ageRange: "3-5 años",
      enabled: true,
    },
    {
      id: "primaria",
      name: "Primaria",
      shortName: "Pri",
      slug: "primaria",
      description:
        "Formación académica sólida con valores y pensamiento crítico.",
      ageRange: "6-10 años",
      enabled: true,
    },
    {
      id: "secundaria",
      name: "Secundaria",
      shortName: "Sec",
      slug: "secundaria",
      description:
        "Educación media con orientación hacia la excelencia académica.",
      ageRange: "11-14 años",
      enabled: true,
    },
    {
      id: "media",
      name: "Media Técnica",
      shortName: "Media",
      slug: "media-tecnica",
      description:
        "Bachillerato con énfasis técnico y preparación para la educación superior.",
      ageRange: "15-17 años",
      enabled: true,
    },
  ],
  sections: {
    hero: true,
    about: true,
    levels: true,
    admissions: true,
    news: true,
    testimonials: true,
    gallery: true,
    contact: true,
  },
  admissions: {
    active: true,
    periodLabel: "Admisiones 2026 abiertas",
    ctaLabel: "Solicitar información",
    ctaUrl: "#contacto",
    deadline: "2026-11-30",
    requirements: [
      "Formulario de inscripción",
      "Certificado de notas",
      "Copia del documento de identidad",
      "Entrevista con coordinación",
    ],
  },
  branding: {
    colors: {
      primary: "#1e40af",
      primaryHover: "#1e3a8a",
      primaryActive: "#172554",
      primarySoft: "#dbeafe",
      accent: "#b45309",
      accentSoft: "#ffedd5",
      surface: "#ffffff",
      surfaceMuted: "#f8fafc",
      surfaceStrong: "#f1f5f9",
      surfaceInverse: "#0f172a",
      text: "#1e293b",
      textMuted: "#475569",
      textSubtle: "#64748b",
      textInverse: "#ffffff",
      border: "#e2e8f0",
      borderStrong: "#cbd5e1",
      success: "#15803d",
      warning: "#a16207",
      danger: "#b91c1c",
      info: "#0369a1",
    },
    fonts: {
      sans: '"Inter", "Inter-fallback", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display:
        '"Inter", "Inter-fallback", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
    },
    radius: {
      xs: "0.125rem",
      sm: "0.25rem",
      md: "0.5rem",
      lg: "0.75rem",
      xl: "1rem",
      full: "9999px",
    },
    assets: {
      logo: "/branding/logo.svg",
      logoInverse: "/branding/logo-inverse.svg",
      favicon: "/branding/favicon.svg",
      ogImage: "/branding/og-image.svg",
      tourVideoPoster: "/branding/placeholders/hero-tour-poster.jpg",
      heroPhoto: "/branding/placeholders/hero-photo.avif",
    },
  },
  seo: {
    titleTemplate: "%s | Colegio Piloto",
    defaultTitle: "Inicio",
    defaultDescription:
      "Colegio Piloto: educación integral de calidad para preescolar, primaria, secundaria y media técnica.",
    keywords: ["colegio", "educación", "primaria", "secundaria", "Bogotá"],
    author: "Colegio Piloto",
    siteUrl: "https://colegioweb.vercel.app",
    ogImage: "/branding/og-image.svg",
    twitterHandle: "@colegiopiloto",
  },
  supabase: {
    url: "https://placeholder.supabase.co",
    anonKeyEnvName: "PUBLIC_SUPABASE_ANON_KEY",
    serviceKeyEnvName: "SUPABASE_SERVICE_ROLE_KEY",
  },
});
