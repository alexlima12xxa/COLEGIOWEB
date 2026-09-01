import { createHash } from "node:crypto";

/**
 * UUID v5 determinista.
 *
 * Se usa para generar el campo `id` de las entradas que vienen de Astro
 * Content Collections (Decap CMS guarda archivos sin UUID). Al ser
 * determinista, el mismo `slug` siempre produce el mismo UUID, lo que mantiene
 * estabilidad entre builds y permite comparar datos con Supabase en Fase 2.
 *
 * El namespace por defecto es el OID DNS de UUID v5; cualquier namespace
 * UUIDv5 válido funciona siempre que sea constante para el proyecto.
 */

const DEFAULT_NAMESPACE = "6ba7b812-9dad-11d1-80b4-00c04fd430c8";

function uuidToBytes(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, "");
  return Buffer.from(hex, "hex");
}

export function uuidv5(
  name: string,
  namespace: string = DEFAULT_NAMESPACE,
): string {
  const hash = createHash("sha1")
    .update(uuidToBytes(namespace))
    .update(name, "utf8")
    .digest();

  // Variant y versión según RFC 4122
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const bytes = Array.from(hash.slice(0, 16));
  const parts = [
    bytes
      .slice(0, 4)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    bytes
      .slice(4, 6)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    bytes
      .slice(6, 8)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    bytes
      .slice(8, 10)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
    bytes
      .slice(10, 16)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  ];

  return parts.join("-");
}
