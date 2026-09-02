/**
 * Config per-school — COLEGIO PILOTO.
 *
 * Datos planos del white-label (sin schema): identidad, contacto, niveles,
 * secciones, admisiones, branding, SEO y Supabase.
 *
 * ⚠️ No importar NADA desde `../site.config.ts` (schema) — crearía una
 * dependencia circular: site.config.ts hace `import.meta.glob` eager sobre
 * este directorio. La validación ocurre en el cargador (site.config.ts)
 * vía `siteConfigSchema.parse()`.
 *
 * Colegios nuevos → `apps/web/src/configs/<slug>.ts` con la misma forma y
 * assets en `public/branding/<slug>/`.
 */

export default {
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
};
