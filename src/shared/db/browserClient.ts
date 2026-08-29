import { createClient } from "@supabase/supabase-js";

export interface BrowserClientConfig {
  url: string;
  anonKey: string;
  tenantId?: string;
}

/**
 * Cliente de Supabase para el navegador (anon key).
 *
 * - Usa solo la anon key; nunca la service role key.
 * - Envía el tenant como cabecera X-Tenant-Id para que RLS lo resuelva.
 * - No persiste sesión: cada request es independiente.
 */
export function createBrowserClient({ url, anonKey, tenantId }: BrowserClientConfig) {
  const headers: Record<string, string> = {};

  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers,
    },
  });
}
