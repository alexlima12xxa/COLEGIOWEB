import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase con service role, SOLO para el plano operador (/operador).
// ---------------------------------------------------------------------------
// La service role key bypassa RLS y otorga acceso cross-tenant. Solo puede
// usarse server-side, nunca desde el navegador:
//   - `import "server-only"` rompe el build si un client component lo importa.
//   - `SUPABASE_SERVICE_ROLE_KEY` no lleva prefijo NEXT_PUBLIC_, así que Next
//     nunca la inyecta en el bundle del cliente.
//
// Patrón del operador (ver reports/2026-09-21_alta-colegios-operador.md):
//   - Identidad: requireSuperadmin() usa el cliente anon + JWT (getUser).
//   - Poder:     las operaciones (listar/provisionar) usan este cliente.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
