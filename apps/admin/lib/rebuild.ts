import type { SupabaseClient } from "@supabase/supabase-js";

// Trigger de rebuild de la web SSG (GATE A8 + modelo multi-colegio).
// ---------------------------------------------------------------------------
// La web pública (Astro SSG) lee el contenido de Supabase SOLO durante el
// build. Cuando el director publica o edita contenido desde el panel, hay que
// re-construir la web para que los cambios aparezcan en <5 min.
//
// Mecanismo: POST al Deploy Hook de Vercel del proyecto web del colegio.
// La URL se lee de tenant_settings.rebuild_hook_url (por tenant), con
// fallback a la env var REBUILD_HOOK_URL (compatibilidad con el flujo
// original de un solo colegio).
//
// - Si no hay hook configurado → no-op (el panel sigue funcionando; la web
//   simplemente no se actualiza automáticamente).
// - Nunca lanza: un fallo del hook no debe romper la acción del panel.
export async function triggerRebuild(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<void> {
  const hookUrl = await resolveHookUrl(supabase, tenantId);
  if (!hookUrl) return;

  try {
    await fetch(hookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  } catch (error) {
    console.error(
      "[rebuild] No se pudo disparar el rebuild de la web:",
      error instanceof Error ? error.message : error,
    );
  }
}

// Resuelve el deploy hook del tenant: tenant_settings.rebuild_hook_url, o
// fallback a REBUILD_HOOK_URL si no hay registro (compatibilidad).
async function resolveHookUrl(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("tenant_settings")
    .select("rebuild_hook_url")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!error && data?.rebuild_hook_url) {
    return data.rebuild_hook_url;
  }

  if (error) {
    console.error(
      "[rebuild] No se pudo leer tenant_settings:",
      error.message,
    );
  }

  return process.env.REBUILD_HOOK_URL ?? null;
}