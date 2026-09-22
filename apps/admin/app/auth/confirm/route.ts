import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route Handler del enlace de email de Supabase Auth (recovery / invite).
// ---------------------------------------------------------------------------
// El template de email apunta aquí con `token_hash` + `type`. Canjeamos el
// token por una sesión con verifyOtp() (flujo robusto cross-dispositivo, no
// depende del code_verifier PKCE del navegador que abrió el enlace).
//
// Éxito → redirige a `next` (por defecto /reset-password para recovery/invite).
// Fallo  → vuelve a /login con un aviso de enlace inválido o caducado.

const VALID_TYPES = ["recovery", "invite", "email", "magiclink"] as const;
type OtpType = (typeof VALID_TYPES)[number];

function isOtpType(value: string | null): value is OtpType {
  return value !== null && (VALID_TYPES as readonly string[]).includes(value);
}

// Solo aceptamos rutas internas (anti open-redirect).
function safeNext(next: string | null, fallback: string): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\")
  ) {
    return fallback;
  }
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const fallback =
    type === "recovery" || type === "invite" ? "/reset-password" : "/login";
  const next = safeNext(searchParams.get("next"), fallback);

  if (token_hash && isOtpType(type)) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=enlace", origin));
}
