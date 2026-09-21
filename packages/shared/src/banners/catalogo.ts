import type { EditableSchema } from "./contratos";
import { REFUERZO_1_TONOS } from "./refuerzo-1-tonos";
import { MATRICULA_2_TONOS } from "./matricula-2-tonos";
import { AVISO_1_TONOS } from "./aviso-1-tonos";

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
   * Contenido de referencia del diseño (Figma). El panel lo precarga al crear
   * un banner para que el docente vea el banner **exacto** tal cual se verá en
   * web. Debe contener los textos finales del diseño, NO placeholders genéricos.
   * Regla: siempre usar los textos reales del diseño/Figma.
   */
  ejemplo: Record<string, unknown>;
  /**
   * Ancho del frame de Figma (px) del canvas de la plantilla. Alimenta el
   * preview proporcional del admin (grid y modal). Opcional: si falta, se usa
   * el fallback que reproduce el recorte histórico del hero.
   */
  anchoFigma?: number;
  /** Alto del frame de Figma (px). Ver `anchoFigma`. */
  altoFigma?: number;
}

export const BANNERS_SLUGS = [
  "matricula-banner",
  "refuerzo-1",
  "matricula-2",
  "aviso-1",
] as const;
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
  {
    slug: "refuerzo-1",
    nombre: "Refuerzo-1",
    anchoFigma: 1600,
    altoFigma: 720,
    contrato: {
      slug: "refuerzo-1",
      nombre: "Refuerzo 1",
      campos: [
        { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true, maxLength: 25 },
        { key: "title", label: "Título", tipo: "texto", maxLength: 8 },
        { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true, maxLength: 35 },
        {
          key: "tono",
          label: "Color de la forma y del botón",
          tipo: "opciones",
          default: REFUERZO_1_TONOS[0].key,
          opciones: REFUERZO_1_TONOS.map((t) => ({ label: t.label, value: t.key })),
        },
        {
          key: "image",
          label: "Foto (marco festoneado)",
          tipo: "imagen",
          ayuda:
            "PNG/AVIF con transparencia; el festoneado va integrado en el archivo (al menos 1062×1282).",
        },
        { key: "actions", label: "Botones", tipo: "booleano" },
      ],
    },
    ejemplo: {
      kicker: "REFUERZO ESCOLAR",
      title: "2027",
      subtitle: "FECHA: 15 DE MAYO",
      tono: REFUERZO_1_TONOS[0].key,
      image: "/branding/placeholders/foto-nina.avif",
      imageAlt: "Estudiante enmarcada con marco festoneado",
      cta: { label: "Informes aquí", href: "whatsapp", variant: "primary" },
    },
  },
  {
    slug: "matricula-2",
    nombre: "Matrícula 2",
    anchoFigma: 1600,
    altoFigma: 720,
    contrato: {
      slug: "matricula-2",
      nombre: "Matrícula 2",
      campos: [
        { key: "title", label: "Título principal", tipo: "texto", maxLength: 12 },
        { key: "subtitle", label: "Año / Destacado", tipo: "texto", maxLength: 6 },
        {
          key: "tono",
          label: "Color de fondo (Rojo o Azul)",
          tipo: "opciones",
          default: MATRICULA_2_TONOS[0].key,
          opciones: MATRICULA_2_TONOS.map((t) => ({ label: t.label, value: t.key })),
        },
        {
          key: "image",
          label: "Foto grupal con marco",
          tipo: "imagen",
          ayuda: "PNG/AVIF con transparencia; marco polaroid integrado (al menos 1966×1024).",
        },
        {
          key: "background",
          label: "Fondo personalizado",
          tipo: "imagen",
          opcional: true,
          ayuda: "Reemplaza el degradado de la plantilla. JPG/PNG/WebP/AVIF.",
        },
        { key: "actions", label: "Botón CTA", tipo: "booleano" },
      ],
    },
    ejemplo: {
      title: "Matrícula",
      subtitle: "2027",
      tono: MATRICULA_2_TONOS[0].key,
      image: "/branding/placeholders/ninos-grupo.avif",
      imageAlt: "Grupo de estudiantes con marco polaroid",
      cta: { label: "Más información", href: "whatsapp", variant: "primary" },
    },
  },
  {
    slug: "aviso-1",
    nombre: "Aviso 1",
    anchoFigma: 1600,
    altoFigma: 720,
    contrato: {
      slug: "aviso-1",
      nombre: "Aviso 1",
      campos: [
        { key: "title", label: "Título principal", tipo: "texto", maxLength: 60 },
        {
          key: "tono",
          label: "Color del texto y del botón",
          tipo: "opciones",
          default: AVISO_1_TONOS[0].key,
          opciones: AVISO_1_TONOS.map((t) => ({ label: t.label, value: t.key })),
        },
        {
          key: "image",
          label: "Foto del profesor",
          tipo: "imagen",
          ayuda: "JPG/PNG/WebP/AVIF; al menos 988×988 (retina ×2).",
        },
        {
          key: "background",
          label: "Fondo cuadriculado",
          tipo: "imagen",
          opcional: true,
          ayuda: "Reemplaza el fondo de la plantilla. JPG/PNG/WebP/AVIF.",
        },
        { key: "actions", label: "Botón CTA", tipo: "booleano" },
      ],
    },
    ejemplo: {
      title: "¡CONTAMOS CON PROFESORES ESPECIALISTAS EN CADA ÁREA!",
      tono: AVISO_1_TONOS[0].key,
      image: "/branding/placeholders/profe-ensenando.avif",
      imageAlt: "Docente sonriendo frente a la pizarra",
      background: "/branding/placeholders/fondocuadriculado.avif",
      cta: { label: "Más información", href: "/formulario", variant: "primary" },
    },
  },
];

export function catalogoPorSlug(slug: string): EntradaCatalogo | undefined {
  return CATALOGO_BANNERS.find((b) => b.slug === slug);
}

/** Proporción de respaldo del preview (entradas sin frame Figma declarado). */
const ASPECTO_FALLBACK = { ancho: 1280, alto: 648 } as const;

/**
 * Proporción del canvas Figma de una plantilla, para el preview proporcional
 * del admin. Si la plantilla no declara `anchoFigma`/`altoFigma`, devuelve el
 * fallback (1280×648), que reproduce el recorte histórico del hero.
 */
export function aspectoDePlantilla(slug: string): {
  ancho: number;
  alto: number;
} {
  const entrada = catalogoPorSlug(slug);
  return {
    ancho: entrada?.anchoFigma ?? ASPECTO_FALLBACK.ancho,
    alto: entrada?.altoFigma ?? ASPECTO_FALLBACK.alto,
  };
}

/** Datos de ejemplo de una plantilla (o `{}` si no existe). */
export function ejemploDePlantilla(slug: string): Record<string, unknown> {
  return catalogoPorSlug(slug)?.ejemplo ?? {};
}

/**
 * Datos vacíos para un banner nuevo: solo el valor por defecto del campo
 * `tono` (si existe). El formulario empieza en blanco para que el director
 * escriba sus propios textos desde cero.
 */
export function datosVacios(slug: string): Record<string, unknown> {
  const entrada = catalogoPorSlug(slug);
  if (!entrada) return {};

  const datos: Record<string, unknown> = {};
  const tonoDefault = entrada.contrato.campos.find(
    (c) => c.key === "tono" && c.tipo === "opciones",
  )?.default;

  if (typeof tonoDefault === "string") datos.tono = tonoDefault;
  return datos;
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