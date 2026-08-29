import { z } from "astro/zod";

/**
 * Contrato de datos compartido (GATE 4).
 *
 * Las tablas de Supabase (supabase/migrations/20260828000000_init.sql) y los
 * fallbacks JSON de src/data/fallback/ usan EXACTAMENTE estos esquemas:
 *  - La Data API devuelve columnas con alias camelCase (imagen_path → imagenPath)
 *    mediante la cláusula `select` de PostgREST.
 *  - Los fallbacks versionados ({"version": 1, "items": [...]}) se validan con
 *    los mismos esquemas antes de usarse en build.
 *
 * Si cambia una tabla, cambia este archivo Y se incrementa el `version` de los
 * fallbacks afectados.
 */

export const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug inválido: solo minúsculas, números y guiones",
  );

/** Acepta null (columnas nullable de Postgres) y undefined (fallback JSON). */
const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

/**
 * ISO 8601 datetime con zona horaria. PostgREST serializa timestamptz como
 * "2026-08-18T09:00:00+00:00" (offset), que z.iso.datetime() de zod v4
 * rechaza (solo admite "Z").
 */
const isoDatetimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    "Fecha ISO 8601 con zona horaria inválida",
  );

export const colegioSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
  nombre: z.string().min(1),
  slogan: nullableString,
  activo: z.boolean().default(true),
});

export type Colegio = z.infer<typeof colegioSchema>;

export const noticiaSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
  titulo: z.string().min(1).max(200),
  resumen: nullableString,
  contenido: z.string().min(1),
  imagenPath: nullableString,
  imagenAlt: z.string().default(""),
  autor: nullableString,
  publicadoEn: isoDatetimeSchema,
});

export type Noticia = z.infer<typeof noticiaSchema>;

export const noticiasFallbackSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(noticiaSchema),
});

export const circularSchema = z.object({
  id: z.uuid(),
  titulo: z.string().min(1).max(200),
  descripcion: nullableString,
  categoria: nullableString,
  fecha: z.iso.date(),
  archivoPath: nullableString,
  archivoNombre: nullableString,
  publicadoEn: isoDatetimeSchema.optional(),
});

export type Circular = z.infer<typeof circularSchema>;

export const circularesFallbackSchema = z.object({
  version: z.number().int().positive(),
  items: z.array(circularSchema),
});

export const leadSchema = z.object({
  id: z.uuid().optional(),
  tenantId: z.uuid().optional(),
  nombre: z.string().min(2).max(120),
  email: z.email(),
  telefono: nullableString,
  nivelInteres: nullableString,
  mensaje: nullableString,
  origen: z.string().default("web"),
  estado: z.string().default("nuevo"),
  createdAt: isoDatetimeSchema.optional(),
});

export type Lead = z.infer<typeof leadSchema>;
