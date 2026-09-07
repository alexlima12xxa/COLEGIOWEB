import { createHmac, timingSafeEqual } from "node:crypto";

// Validación HMAC del token de vista previa emitido por el panel admin.
// ---------------------------------------------------------------------------
// Ver `apps/admin/lib/preview-token.ts` para el contrato completo. La web solo
// VERIFICA (no emite). Sin `PREVIEW_SIGNING_KEY` configurado, todo token se
// rechaza (seguro por defecto → la ruta devuelve 404).

function secret(): string | null {
  return process.env.PREVIEW_SIGNING_KEY ?? null;
}

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
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return (
      typeof parsed.exp === "number" &&
      parsed.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}
