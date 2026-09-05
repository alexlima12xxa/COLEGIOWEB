import type { EditableSchema } from "./contratos";
import { DUOTONO_PARES, GRANULADO_TONOS } from "./palettes";

// Catálogo de banners del hero: registro único que comparten la web (Astro,
// para renderizar) y el panel admin (Next.js, para generar el formulario).
//
// Cada entrada describe:
//  - slug:  clave en `banners.plantilla_id` (BD) y en el mapa de componentes.
//  - nombre: etiqueta visible en el panel.
//  - contratos: campos editables por el director (opciones controladas).
//
// Agregar un banner nuevo (importado de Figma) = añadir una entrada aquí y
// crear su componente .astro en apps/web + registrarlo en HomeBanner.astro.
// NO requiere cambios en Supabase (el contenido vive en `datos jsonb`).

export interface EntradaCatalogo {
  slug: BannerSlug;
  nombre: string;
  contrato: EditableSchema;
}

export const BANNERS_SLUGS = ["duotono", "granulado", "foto"] as const;
export type BannerSlug = (typeof BANNERS_SLUGS)[number];

export const CATALOGO_BANNERS: EntradaCatalogo[] = [
  {
    slug: "duotono",
    nombre: "Duotono (gradiente de 2 colores)",
    contrato: {
      slug: "duotono",
      nombre: "Duotono",
      campos: [
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true },
        { key: "title", label: "Título", tipo: "texto" },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true },
        {
          key: "tono",
          label: "Par de colores",
          tipo: "opciones",
          opciones: DUOTONO_PARES.map((p) => ({ label: p.label, value: p.key })),
        },
      ],
    },
  },
  {
    slug: "granulado",
    nombre: "Fondo sólido granuloso",
    contrato: {
      slug: "granulado",
      nombre: "Granulado",
      campos: [
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true },
        { key: "title", label: "Título", tipo: "texto" },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true },
        {
          key: "tono",
          label: "Tono base",
          tipo: "opciones",
          opciones: GRANULADO_TONOS.map((t) => ({ label: t.label, value: t.key })),
        },
      ],
    },
  },
  {
    slug: "foto",
    nombre: "Foto de fondo",
    contrato: {
      slug: "foto",
      nombre: "Foto",
      campos: [
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true },
        { key: "title", label: "Título", tipo: "texto" },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true },
        { key: "background", label: "Imagen de fondo", tipo: "imagen", ayuda: "Al menos 1920×1080." },
      ],
    },
  },
];

export function catalogoPorSlug(slug: string): EntradaCatalogo | undefined {
  return CATALOGO_BANNERS.find((b) => b.slug === slug);
}