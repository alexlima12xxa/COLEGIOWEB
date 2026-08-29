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

/**
 * Timestamp ISO 8601 con zona horaria. Decap CMS escribe el datetime SIN
 * comillas (ej. `publicadoEn: 2026-08-29T11:39:00Z`), y el parser YAML lo
 * entrega como `Date`. Este schema acepta string o Date y normaliza a string
 * ISO (con zona horaria), que es lo que espera el contrato compartido.
 */
const isoTimestamp = z
  .union([z.string(), z.date()])
  .transform((value) => (value instanceof Date ? value.toISOString() : value));

/** Fecha solo-día (YYYY-MM-DD), también tolerante a Date del parser YAML. */
const dateOnly = z
  .union([z.string(), z.date()])
  .transform((value) =>
    value instanceof Date ? value.toISOString().slice(0, 10) : value,
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
      titulo: z.string().min(1).max(200),
      resumen: nullableString,
      imagenPath: nullableString,
      imagenAlt: z.string().default(""),
      autor: nullableString,
      publicadoEn: isoTimestamp,
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
      fecha: dateOnly,
      archivoPath: nullableString,
      archivoNombre: nullableString,
      publicadoEn: isoTimestamp,
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
      titulo: nullableString,
      categoria: nullableString,
      imagenPath: z.string().min(1),
      imagenAlt: z.string().default(""),
      orden: z.number().int().default(0),
      publicadoEn: isoTimestamp.optional(),
    }),
  }),
};
