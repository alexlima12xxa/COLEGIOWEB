import { createHmac, timingSafeEqual } from "node:crypto";

// Firma HMAC de tokens de vista previa (opción 2).
// ---------------------------------------------------------------------------
// El panel admin EMITE un token firmado de corta vida (TTL) para autorizar la
// carga de la ruta /preview-admin de la web. La web lo VALIDA con el MISMO
// secreto server-only `PREVIEW_SIGNING_KEY`. El token NO es un secreto estático
// (no viaja en NEXT_PUBLIC_*): es un artefacto `base64url(payload).firma` con
// caducidad, de modo que una filtración solo da acceso efímero y de lectura.
//
// El token autoriza "este editor puede cargar el preview durante TTL segundos";
// NO firma el contenido del borrador (`?datos=` viaja aparte, sin firmar) para
// no tener que re-firmar en cada tecla.

const TOKEN_TTL_SECONDS = 300; // 5 minutos.

function secret(): string | null {
  return process.env.PREVIEW_SIGNING_KEY ?? null;
}

function b64url(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64url");
}

/**
 * Emite un token firmado con TTL (exp). Si no hay `PREVIEW_SIGNING_KEY`
 * configurado, devuelve `null` (el preview queda deshabilitado, no falla).
 */
export function signPreviewToken(ttlSeconds: number = TOKEN_TTL_SECONDS): string | null {
  const key = secret();
  if (!key) return null;

  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = b64url(JSON.stringify({ exp }));
  const sig = createHmac("sha256", key).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/**
 * Valida firma y caducidad de un token emitido por `signPreviewToken`.
 * Comparación en tiempo constante; rechaza payload malformado o expirado.
 */
export function verifyPreviewToken(token: string | null): boolean {
  const key = secret();
  if (!key || !token) return false;

  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = createHmac("sha256", key).update(payload).digest();
  const provided = Buffer.from(sig, "base64url");
  if (provided.length !== expected.length) return false;
  if (!timingSafeEqual(provided, expected)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}