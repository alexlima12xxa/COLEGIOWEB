// Edge Function: send-lead-email
// ---------------------------------------------------------------------------
// Envía un correo al colegio cuando entra un lead nuevo en la tabla `leads`.
//
// Flujo:
//   Supabase Database Webhook (INSERT en leads)
//     -> POST a esta función (con cabecera x-webhook-token)
//     -> resuelve el correo destino del tenant (clave `notificaciones` o secret)
//     -> POST a la API de Resend
//     -> el correo llega al inbox del colegio
//
// Configuración (ver supabase/functions/README.md):
//   supabase secrets set RESEND_API_KEY=re_... LEAD_EMAIL_TO=colegio@email.com \
//     WEBHOOK_TOKEN=<token> SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...

// @deno-types="npm:@supabase/supabase-js@2"
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const LEAD_EMAIL_TO = Deno.env.get("LEAD_EMAIL_TO");
const WEBHOOK_TOKEN = Deno.env.get("WEBHOOK_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Remitente del dominio verificado en Resend (YACHAY IA). Cuando un colegio
// verifique su propio dominio, puede sustituirse por un remitente por tenant
// (`informes@colegio.edu`).
const FROM_ADDRESS = "YACHAY IA <soporte@yachay-ia.com>";

interface LeadRecord {
  id?: string;
  tenant_id?: string;
  nombre?: string;
  email?: string;
  telefono?: string | null;
  nivel_interes?: string | null;
  mensaje?: string | null;
  origen?: string;
}

function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml(record: LeadRecord): string {
  const nombre = escapeHtml(record.nombre);
  const email = escapeHtml(record.email);
  const telefono = escapeHtml(record.telefono ?? "—");
  const nivel = escapeHtml(record.nivel_interes ?? "—");
  const mensaje = escapeHtml(record.mensaje ?? "");

  return `<!doctype html>
<html>
  <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.5; color: #18181b;">
    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 4px; font-size: 20px;">Nueva solicitud de información</h2>
      <p style="margin: 0 0 20px; color: #52525b;">Un visitante completó el formulario de admisiones.</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #52525b; width: 40%; vertical-align: top;">Nombre</td>
          <td style="padding: 8px 0; vertical-align: top;">${nombre}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #52525b; vertical-align: top;">Email</td>
          <td style="padding: 8px 0; vertical-align: top;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #52525b; vertical-align: top;">Teléfono</td>
          <td style="padding: 8px 0; vertical-align: top;">${telefono}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #52525b; vertical-align: top;">Grado de interés</td>
          <td style="padding: 8px 0; vertical-align: top;">${nivel}</td>
        </tr>
        ${mensaje ? `<tr>
          <td style="padding: 8px 0; font-weight: 600; color: #52525b; vertical-align: top;">Mensaje</td>
          <td style="padding: 8px 0; vertical-align: top;">${mensaje}</td>
        </tr>` : ""}
      </table>
      <p style="margin: 24px 0 0; font-size: 12px; color: #a1a1aa;">Puedes ver y gestionar este lead desde el panel de administración.</p>
    </div>
  </body>
</html>`;
}

// Resuelve el correo destino del tenant. Primero intenta la clave `notificaciones`
// en la tabla `contenido` (editable desde el panel admin); si no existe, usa el
// secret LEAD_EMAIL_TO como respaldo.
async function resolveDestination(
  tenantId: string | undefined,
): Promise<string> {
  if (!tenantId || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return LEAD_EMAIL_TO ?? "";
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data } = await supabase
      .from("contenido")
      .select("valor")
      .eq("tenant_id", tenantId)
      .eq("clave", "notificaciones")
      .maybeSingle();

    const email = (data?.valor as { email?: string } | null)?.email;
    if (email) return email;
  } catch (error) {
    console.error("[send-lead-email] Error resolviendo destino:", error);
  }

  return LEAD_EMAIL_TO ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (!RESEND_API_KEY) {
    return new Response("RESEND_API_KEY no configurada", { status: 500 });
  }

  // Protección contra spam: cabecera fijada por Supabase al configurar el webhook.
  if (WEBHOOK_TOKEN && req.headers.get("x-webhook-token") !== WEBHOOK_TOKEN) {
    return new Response("No autorizado", { status: 401 });
  }

  let payload: { record?: LeadRecord } = {};
  try {
    payload = await req.json();
  } catch {
    return new Response("Payload inválido", { status: 400 });
  }

  const record = payload.record;
  if (!record || !record.nombre || !record.email) {
    return new Response("Payload de lead incompleto", { status: 400 });
  }

  const to = await resolveDestination(record.tenant_id);
  if (!to) {
    return new Response("No hay correo destino configurado (LEAD_EMAIL_TO)", {
      status: 500,
    });
  }

  const subject = `Nueva solicitud de información — ${record.nombre}`;
  const html = buildHtml(record);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Resend falló: ${response.status} ${body}`);
      return new Response(JSON.stringify({ ok: false, error: "Resend error" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-lead-email] Error enviando correo:", error);
    return new Response(JSON.stringify({ ok: false, error: "send error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});