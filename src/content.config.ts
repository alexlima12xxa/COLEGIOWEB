import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Configuración moderna de Astro Content Collections (Astro v7).
 *
 * Los archivos en src/content/ los edita Decap CMS (usuarios no técnicos).
 * Por eso estos schemas son DEFENSIVOS: nunca lanzan error por un campo
 * faltante o malformado, solo normalizan el tipo. Una entrada incompleta del
 * CMS jamás debe tumbar el build. La validación estricta (con defaults y
 * filtrado) se hace en src/shared/db/content.ts.
 */

/** string opcional: null/undefined/vacío → undefined (trim). */
const nullableString = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value ? value : undefined));

/**
 * Timestamp ISO 8601 con zona horaria. Decap CMS escribe el datetime SIN
 * comillas (ej. `publicadoEn: 2026-08-29T11:39:00Z`), y el parser YAML lo
 * entrega como `Date`. Normaliza a string ISO (o undefined si falta).
 */
const isoTimestamp = z
  .union([z.string(), z.date()])
  .nullish()
  .transform((value) =>
    value instanceof Date ? value.toISOString() : (value ?? undefined),
  );

/** Fecha solo-día (YYYY-MM-DD), tolerante a Date del parser YAML. */
const dateOnly = z
  .union([z.string(), z.date()])
  .nullish()
  .transform((value) =>
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : (value ?? undefined),
  );

export const collections = {
  noticias: defineCollection({
    loader: glob({
      pattern: "**/[^_]*.md",
      base: "./src/content/noticias",
    }),
    schema: z.object({
      titulo: nullableString,
      resumen: nullableString,
      imagenPath: nullableString,
      imagenAlt: nullableString,
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
      titulo: nullableString,
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
      slug: nullableString,
      titulo: nullableString,
      descripcion: nullableString,
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
      imagenPath: nullableString,
      imagenAlt: nullableString,
      orden: z.coerce.number().int().default(0),
      publicadoEn: isoTimestamp,
    }),
  }),
};
