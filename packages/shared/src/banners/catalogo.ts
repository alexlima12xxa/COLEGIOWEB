import type { EditableSchema } from "./contratos";

// Catálogo de banners del hero: registro único que comparten la web (Astro,
// para renderizar) y el panel admin (Next.js, para generar el formulario).
//
// Cada entrada describe:
//  - slug:  clave en `banners.plantilla_id` (BD) y en el mapa de componentes.
//  - nombre: etiqueta visible en el panel.
//  - contrato: campos editables por el director (opciones controladas).
//
// Agregar un banner nuevo = añadir una entrada aquí, crear su componente
// .astro en apps/web/.../templates/ y su CSS en packages/shared/src/banners/css/
// con nombre `<slug>.css` (se importa con la ruta real, sin alias en package.json).
// Hay que registrarlo en el mapa `COMPONENTES` de HomeBanner.astro. NO requiere
// cambios en Supabase (el contenido vive en `datos jsonb`).

export interface EntradaCatalogo {
  slug: BannerSlug;
  nombre: string;
  contrato: EditableSchema;
  /**
   * Contenido de ejemplo de la plantilla. El panel lo precarga al crear un
   * banner para que el director vea el diseño real completo (con textos) ANTES
   * de escribir. Debe ser un `datos` válido para la plantilla.
   */
  ejemplo: Record<string, unknown>;
}

export const BANNERS_SLUGS = ["matricula-banner"] as const;
export type BannerSlug = (typeof BANNERS_SLUGS)[number];

export const CATALOGO_BANNERS: EntradaCatalogo[] = [
  {
    slug: "matricula-banner",
    nombre: "matricula-1",
    contrato: {
      slug: "matricula-banner",
      nombre: "Matrícula",
      campos: [
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true, maxLength: 60 },
        { key: "title", label: "Título", tipo: "texto", maxLength: 160 },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true, maxLength: 300 },
        {
          key: "image",
          label: "Silueta (PNG transparente)",
          tipo: "imagen",
          ayuda: "PNG con fondo transparente, al menos 800×1200.",
        },
        { key: "actions", label: "Botones", tipo: "booleano" },
      ],
    },
    ejemplo: {
      title: "MATRÍCULA",
      subtitle: "2027",
      image: "/branding/placeholders/nino-birrete.avif",
      imageAlt: "Estudiante sonriendo con birrete celebrando matrícula escolar",
      cta: { label: "Inscríbete aquí", href: "/admisiones", variant: "primary" },
    },
  },
];

export function catalogoPorSlug(slug: string): EntradaCatalogo | undefined {
  return CATALOGO_BANNERS.find((b) => b.slug === slug);
}

/** Datos de ejemplo de una plantilla (o `{}` si no existe). */
export function ejemploDePlantilla(slug: string): Record<string, unknown> {
  return catalogoPorSlug(slug)?.ejemplo ?? {};
}

// Campos de contenido que, si el director no los toca, delatan que el banner
// sigue siendo el ejemplo (guard para no publicar textos de muestra).
const CAMPOS_EJEMPLO = ["title", "subtitle", "kicker"] as const;

/**
 * ¿El borrador sigue teniendo el contenido de ejemplo? Se usa para avisar (y
 * bloquear en el server) al guardar un banner nuevo sin editarlo.
 */
export function esContenidoEjemplo(
  slug: string,
  datos: Record<string, unknown>,
): boolean {
  const ejemplo = catalogoPorSlug(slug)?.ejemplo;
  if (!ejemplo) return false;

  const hayEjemplo = CAMPOS_EJEMPLO.some(
    (k) => typeof ejemplo[k] === "string" && (ejemplo[k] as string).length > 0,
  );
  if (!hayEjemplo) return false;

  return CAMPOS_EJEMPLO.every(
    (k) => String(datos[k] ?? "") === String(ejemplo[k] ?? ""),
  );
}