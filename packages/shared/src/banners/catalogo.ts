import type { EditableSchema } from "./contratos";
import { PRUEBA_TONOS } from "./palettes";

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
}

export const BANNERS_SLUGS = ["prueba"] as const;
export type BannerSlug = (typeof BANNERS_SLUGS)[number];

export const CATALOGO_BANNERS: EntradaCatalogo[] = [
  {
    slug: "prueba",
    nombre: "Plantilla de prueba",
    contrato: {
      slug: "prueba",
      nombre: "Prueba",
      campos: [
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true, maxLength: 60 },
        { key: "title", label: "Título", tipo: "texto", maxLength: 160 },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true, maxLength: 300 },
        {
          key: "tono",
          label: "Tono de colores",
          tipo: "opciones",
          default: PRUEBA_TONOS[0].key,
          opciones: PRUEBA_TONOS.map((t) => ({ label: t.label, value: t.key })),
        },
        { key: "actions", label: "Botones", tipo: "booleano" },
      ],
    },
  },
];

export function catalogoPorSlug(slug: string): EntradaCatalogo | undefined {
  return CATALOGO_BANNERS.find((b) => b.slug === slug);
}