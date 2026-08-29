import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Configuración moderna de Astro Content Collections (Astro v7).
 *
 * Decap CMS edita archivos en src/content/. Cada colección usa el loader glob
 * local y schemas que coinciden con los contratos de Supabase en
 * src/shared/db/schema.ts, para que la migración a BD en Fase 2 no requiera
 * rediseñar componentes.
 */

const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug inválido: solo minúsculas, números y guiones",
  );

const isoDatetimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    "Fecha ISO 8601 con zona horaria inválida",
  );

const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

export const collections = {
  noticias: defineCollection({
    loader: glob({
      pattern: "**/[^_]*.md",
      base: "./src/content/noticias",
    }),
    schema: z.object({
      slug: slugSchema,
      titulo: z.string().min(1).max(200),
      resumen: nullableString,
      imagenPath: nullableString,
      imagenAlt: z.string().default(""),
      autor: nullableString,
      publicadoEn: isoDatetimeSchema,
    }),
  }),

  circulares: defineCollection({
    loader: glob({
      pattern: "**/[^_]*.md",
      base: "./src/content/circulares",
    }),
    schema: z.object({
      titulo: z.string().min(1).max(200),
      descripcion: nullableString,
      categoria: nullableString,
      fecha: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha YYYY-MM-DD inválida"),
      archivoPath: nullableString,
      archivoNombre: nullableString,
      publicadoEn: isoDatetimeSchema,
    }),
  }),

  paginas: defineCollection({
    loader: glob({
      pattern: "**/[^_]*.md",
      base: "./src/content/paginas",
    }),
    schema: z.object({
      slug: slugSchema,
      titulo: z.string().min(1).max(200),
      descripcion: nullableString,
      contenido: z.string().default(""),
    }),
  }),

  galeria: defineCollection({
    loader: glob({
      pattern: "**/[^_]*.md",
      base: "./src/content/galeria",
    }),
    schema: z.object({
      slug: slugSchema,
      titulo: nullableString,
      categoria: nullableString,
      imagenPath: z.string().min(1),
      imagenAlt: z.string().default(""),
      orden: z.number().int().default(0),
      publicadoEn: isoDatetimeSchema.optional(),
    }),
  }),
};
