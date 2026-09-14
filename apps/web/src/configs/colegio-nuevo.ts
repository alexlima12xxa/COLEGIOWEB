/**
 * Config per-school — COLEGIO NUEVO.
 *
 * Datos planos del white-label (sin schema): identidad, contacto, niveles,
 * secciones, admisiones, branding, SEO y Supabase.
 *
 * ⚠️ No importar NADA desde `../site.config.ts` (schema) — crearía una
 * dependencia circular: site.config.ts hace `import.meta.glob` eager sobre
 * este directorio. La validación ocurre en el cargador (site.config.ts)
 * vía `siteConfigSchema.parse()`.
 */

export default {
  identity: {
    name: "Colegio Nuevo",
    campus: "Sede Principal",
    slogan: "Inspiramos tu mente para que lideres el futuro",
    shortDescription:
      "Institución educativa comprometida con la excelencia académica y la formación integral.",
    description:
      "Somos una institución educativa comprometida con la formación integral de estudiantes íntegros, críticos y preparados para los desafíos del mundo actual.",
    founded: 2026,
  },
  contact: {
    address: "Calle 123 # 45-67",
    city: "Bogotá, Colombia",
    phone: "+57 601 234 5678",
    whatsapp: "+573101234567",
    email: "correopruebaprueba998@gmail.com",
    mapUrl: "https://maps.google.com/?q=Colegio+Nuevo+Bogota",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.1234567890123!2d-74.08175!3d4.60971!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNMKwMzYnMzUuMCJOIDc0wrAwNCw1NC4zIg!5e0!3m2!1ses!2sco!4v1600000000000",
    officeHours: "Lunes a viernes, 7:00 a.m. – 4:00 p.m.",
  },
  social: {},
  links: {},
  levels: [
    {
      id: "preescolar",
      name: "Preescolar",
      slug: "preescolar",
      description: "Primera experiencia escolar con enfoque lúdico y afectivo.",
      ageRange: "3-5 años",
      subtitle: "Bilingüe · Estimulación temprana",
      image: "/branding/colegio-nuevo/placeholders/level-preescolar.jpg",
      enabled: true,
    },
    {
      id: "primaria",
      name: "Primaria",
      slug: "primaria",
      description:
        "Formación académica sólida con valores y pensamiento crítico.",
      ageRange: "6-10 años",
      subtitle: "Grados 1° a 5° · Enfoque STEAM",
      image: "/branding/colegio-nuevo/placeholders/level-primaria.jpg",
      enabled: true,
    },
    {
      id: "secundaria",
      name: "Secundaria",
      slug: "secundaria",
      description:
        "Educación media con orientación hacia la excelencia académica.",
      ageRange: "11-17 años",
      subtitle: "Grados 6° a 11° · Orientación Vocacional",
      image: "/branding/colegio-nuevo/placeholders/level-secundaria.jpg",
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
    ctaUrl: "/formulario",
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
      primary: "#CC0000",
      primaryHover: "#A80000",
      primaryActive: "#800000",
      primarySoft: "#FDECEC",
      accent: "#CC0000",
      accentSoft: "#FDECEC",
      surface: "#FFFFFF",
      surfaceMuted: "#F8FAFC",
      surfaceStrong: "#F1F5F9",
      surfaceInverse: "#0F172A",
      text: "#1E293B",
      textMuted: "#475569",
      textSubtle: "#64748B",
      textInverse: "#FFFFFF",
      border: "#E2E8F0",
      borderStrong: "#CBD5E1",
      success: "#15803D",
      warning: "#A16207",
      danger: "#B91C1C",
      info: "#0369A1",
    },
    fonts: {
      sans: '"Inter", "Inter-fallback", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      display:
        '"Outfit", "Outfit-fallback", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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
      logo: "/branding/colegio-nuevo/logo.svg",
      logoInverse: "/branding/colegio-nuevo/logo-inverse.svg",
      favicon: "/branding/colegio-nuevo/favicon.svg",
      ogImage: "/branding/colegio-nuevo/og-image.svg",
      tourVideoPoster:
        "/branding/colegio-nuevo/placeholders/hero-tour-poster.jpg",
      heroPhoto: "/branding/colegio-nuevo/placeholders/hero-photo.avif",
    },
  },
  seo: {
    titleTemplate: "%s | Colegio Nuevo",
    defaultTitle: "Inicio",
    defaultDescription:
      "Colegio Nuevo: educación integral de calidad para preescolar, primaria y secundaria.",
    keywords: ["colegio", "educación", "primaria", "secundaria", "Bogotá"],
    author: "Colegio Nuevo",
    siteUrl: "https://colegionuevo.yachay-ia.com",
    ogImage: "/branding/colegio-nuevo/og-image.svg",
    twitterHandle: "@colegionuevo",
  },
  supabase: {
    url: "https://placeholder.supabase.co",
    anonKeyEnvName: "PUBLIC_SUPABASE_ANON_KEY",
    serviceKeyEnvName: "SUPABASE_SERVICE_ROLE_KEY",
  },
};
