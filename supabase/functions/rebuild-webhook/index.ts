// Edge Function: rebuild-webhook
// ---------------------------------------------------------------------------
// Puente entre Supabase y Vercel para re-construir la web SSG cuando cambia
// el contenido editorial (noticias, circulares, ...).
//
// Flujo:
//   Supabase Database Webhook (INSERT/UPDATE/DELETE en noticias/circulares)
//     -> POST a esta función
//     -> POST al Deploy Hook de Vercel
//     -> Vercel re-construye el sitio (< 2 min)
//
// Configuración (ver supabase/functions/README.md):
//   supabase secrets set VERCEL_DEPLOY_HOOK_URL=https://api.vercel.com/... WEBHOOK_TOKEN=<token>

const VERCEL_DEPLOY_HOOK_URL = Deno.env.get("VERCEL_DEPLOY_HOOK_URL");
const WEBHOOK_TOKEN = Deno.env.get("WEBHOOK_TOKEN");

Deno.serve(async (req) => {
  if (!VERCEL_DEPLOY_HOOK_URL) {
    return new Response("VERCEL_DEPLOY_HOOK_URL no configurada", {
      status: 500,
    });
  }

  // Protección contra spam: la cabecera la fija Supabase al configurar el webhook.
  if (WEBHOOK_TOKEN && req.headers.get("x-webhook-token") !== WEBHOOK_TOKEN) {
    return new Response("No autorizado", { status: 401 });
  }

  const response = await fetch(VERCEL_DEPLOY_HOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    console.error(
      `Vercel deploy hook falló: ${response.status} ${response.statusText}`,
    );
    return new Response(
      JSON.stringify({
        ok: false,
        error: `Vercel respondió ${response.status}`,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
