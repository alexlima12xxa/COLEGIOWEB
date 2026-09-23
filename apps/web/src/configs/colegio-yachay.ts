/**
 * Config per-school — COLEGIO YACHAY.
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
    name: "Colegio Yachay",
    slogan: "Formando líderes con valores y excelencia",
    shortDescription: "Institución campestre bilingüe con enfoque STEAM.",
    description:
      "Somos una comunidad educativa venezolana con más de 30 años formando personas íntegras y comprometidas con su entorno. Combinamos excelencia académica, valores y una visión innovadora para preparar a nuestros estudiantes para el futuro.",
    founded: 1990,
  },
  contact: {
    address: "Av este 3 (Esquina avilanes)",
    city: "Caracas, Venezuela",
    phone: "212356234",
    whatsapp: "+584123639900",
    email: "contacto@yachay-ia.com",
    officeHours: "Lunes a viernes, 7:30 a.m. – 1:30 p.m.",
  },
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61593709904136",
    youtube: "https://www.youtube.com/@iaparaprofesores",
    tiktok: "https://www.tiktok.com/@alejandroias",
  },
  links: {},
  levels: [
    {
      id: "preescolar",
      name: "Preescolar",
      slug: "preescolar",
      description: "Primera experiencia escolar con enfoque lúdico y afectivo.",
      ageRange: "3-5 años",
      subtitle: "Bilingüe · Estimulación temprana",
      image: "/branding/colegio-yachay/placeholders/level-preescolar.jpg",
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
      image: "/branding/colegio-yachay/placeholders/level-primaria.jpg",
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
      image: "/branding/colegio-yachay/placeholders/level-secundaria.jpg",
      enabled: true,
    },
  ],
  sections: {
    hero: true,
    about: true,
    levels: true,
    admissions: true,
    news: true,
    testimonials: false,
    gallery: true,
    contact: true,
  },
  admissions: {
    active: true,
    periodLabel: "Admisiones 2027",
    ctaLabel: "Informes aquí",
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
      primary: "#C1004A",
      primaryHover: "#A30040",
      primaryActive: "#850034",
      primarySoft: "#FFE4ED",
      accent: "#C1004A",
      accentSoft: "#FFE4ED",
      surface: "#FFFFFF",
      surfaceMuted: "#FFFBF3",
      surfaceStrong: "#F6EDE8",
      surfaceInverse: "#2B0A16",
      text: "#1E293B",
      textMuted: "#475569",
      textSubtle: "#64748B",
      textInverse: "#FFFFFF",
      border: "#F0DCE3",
      borderStrong: "#D8B7C2",
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
      logo: "/branding/colegio-yachay/logo.png",
      logoInverse: "/branding/colegio-yachay/logo-inverse.png",
      favicon: "/branding/colegio-yachay/favicon.svg",
      ogImage: "/branding/colegio-yachay/og-image.png",
      tourVideoPoster:
        "/branding/colegio-yachay/placeholders/hero-tour-poster.jpg",
      heroPhoto: "/branding/colegio-yachay/placeholders/hero-photo.avif",
    },
  },
  seo: {
    titleTemplate: "Colegio Yachay | %s",
    homeTitle: "Colegio Yachay - Excelencia y Formación Integral",
    defaultDescription:
      "Colegio Yachay, excelencia y formación integral para preescolar, primaria y bachillerato.",
    keywords: ["colegio yachay", "admisiones colegio caracas", "mejor colegio"],
    author: "Colegio Yachay",
    siteUrl: "https://colegiodemo.yachay-ia.com",
    ogImage: "/branding/colegio-yachay/og-image.png",
  },
  supabase: {
    url: "https://placeholder.supabase.co",
    anonKeyEnvName: "PUBLIC_SUPABASE_ANON_KEY",
    serviceKeyEnvName: "SUPABASE_SERVICE_ROLE_KEY",
  },
};
