import type { EditableSchema } from "./contratos";
import { DIAGONAL_TONOS, DUOTONO_PARES, GRANULADO_TONOS } from "./palettes";

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

export const BANNERS_SLUGS = ["duotono", "granulado", "foto", "corte-diagonal"] as const;
export type BannerSlug = (typeof BANNERS_SLUGS)[number];

export const CATALOGO_BANNERS: EntradaCatalogo[] = [
  {
    slug: "duotono",
    nombre: "Duotono (gradiente de 2 colores)",
    contrato: {
      slug: "duotono",
      nombre: "Duotono",
      campos: [
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true, maxLength: 60 },
        { key: "title", label: "Título", tipo: "texto", maxLength: 160 },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true, maxLength: 300 },
        {
          key: "tono",
          label: "Par de colores",
          tipo: "opciones",
          default: DUOTONO_PARES[0].key,
          opciones: DUOTONO_PARES.map((p) => ({ label: p.label, value: p.key })),
        },
        { key: "actions", label: "Botones", tipo: "booleano" },
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
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true, maxLength: 60 },
        { key: "title", label: "Título", tipo: "texto", maxLength: 160 },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true, maxLength: 300 },
        {
          key: "tono",
          label: "Tono base",
          tipo: "opciones",
          default: GRANULADO_TONOS[0].key,
          opciones: GRANULADO_TONOS.map((t) => ({ label: t.label, value: t.key })),
        },
        { key: "actions", label: "Botones", tipo: "booleano" },
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
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true, maxLength: 60 },
        { key: "title", label: "Título", tipo: "texto", maxLength: 160 },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true, maxLength: 300 },
        { key: "background", label: "Imagen de fondo", tipo: "imagen", ayuda: "Al menos 1920×1080." },
        { key: "actions", label: "Botones", tipo: "booleano" },
      ],
    },
  },
  {
    slug: "corte-diagonal",
    nombre: "Corte diagonal con foto",
    contrato: {
      slug: "corte-diagonal",
      nombre: "Corte diagonal",
      campos: [
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true, maxLength: 60 },
        { key: "title", label: "Título", tipo: "texto", maxLength: 160 },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true, maxLength: 300 },
        {
          key: "tono",
          label: "Color del panel",
          tipo: "opciones",
          default: DIAGONAL_TONOS[0].key,
          opciones: DIAGONAL_TONOS.map((t) => ({ label: t.label, value: t.key })),
        },
        { key: "background", label: "Imagen de la derecha", tipo: "imagen", ayuda: "Al menos 1920×1080." },
        { key: "actions", label: "Botones", tipo: "booleano" },
      ],
    },
  },
];

export function catalogoPorSlug(slug: string): EntradaCatalogo | undefined {
  return CATALOGO_BANNERS.find((b) => b.slug === slug);
}