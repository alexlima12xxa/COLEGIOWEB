// Constantes del módulo "footer" compartidas entre el server action y el
// formulario cliente. NO es un módulo "use server": los archivos "use server"
// solo pueden exportar funciones async.

export const REDES_SOCIALES = [
  { clave: "facebook", label: "Facebook" },
  { clave: "instagram", label: "Instagram" },
  { clave: "youtube", label: "YouTube" },
  { clave: "linkedin", label: "LinkedIn" },
  { clave: "x", label: "X (Twitter)" },
  { clave: "tiktok", label: "TikTok" },
] as const;

export type RedSocialClave = (typeof REDES_SOCIALES)[number]["clave"];

// Páginas existentes de la web a las que puede enlazar cada elemento del footer.
// del footer. Misma lista que la navegación (portada) y niveles.
export const PAGINAS_FOOTER = [
  "/",
  "/nosotros",
  "/niveles",
  "/niveles/preescolar",
  "/niveles/primaria",
  "/niveles/secundaria",
  "/admisiones",
  "/noticias",
  "/circulares",
  "/contacto",
] as const;