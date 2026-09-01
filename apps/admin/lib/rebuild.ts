// Trigger de rebuild de la web SSG (GATE A8).
// ---------------------------------------------------------------------------
// La web pública (Astro SSG) lee el contenido de Supabase SOLO durante el
// build. Cuando el director publica o edita contenido desde el panel, hay que
// re-construir la web para que los cambios aparezcan en <5 min.
//
// Mecanismo: POST al Deploy Hook de Vercel del proyecto web. La URL se guarda
// en la env var REBUILD_HOOK_URL (secreto del proyecto admin en Vercel).
//
// - Si REBUILD_HOOK_URL no está configurada → no-op (el panel sigue
//   funcionando; la web simplemente no se actualiza automáticamente).
// - Nunca lanza: un fallo del hook no debe romper la acción del panel.
export async function triggerRebuild(): Promise<void> {
  const hookUrl = process.env.REBUILD_HOOK_URL;
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