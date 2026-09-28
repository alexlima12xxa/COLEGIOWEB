// Catálogo único de páginas de la web a las que pueden enlazar las secciones
// del panel (footer, navbar, CTA de niveles y CTA de banners). Módulo plano:
// NO es "use server" porque lo importan componentes cliente y server actions.
//
// Cuando se agregue una página nueva en apps/web/src/pages/*, basta con
// añadirla aquí: todos los <select> y validaciones la verán.

export const PAGINAS = [
  { route: "/", label: "Inicio" },
  { route: "/nosotros", label: "Nosotros" },
  { route: "/niveles", label: "Niveles" },
  { route: "/niveles/preescolar", label: "Preescolar" },
  { route: "/niveles/primaria", label: "Primaria" },
  { route: "/niveles/secundaria", label: "Secundaria" },
  { route: "/admisiones", label: "Admisiones" },
  { route: "/blog", label: "Blog" },
  { route: "/comunicados", label: "Comunicados" },
  { route: "/contacto", label: "Contacto" },
  { route: "/formulario", label: "Formulario" },
] as const;

export const PAGINAS_ROUTES = PAGINAS.map((p) => p.route) as readonly string[];