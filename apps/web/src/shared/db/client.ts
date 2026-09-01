import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { siteConfig } from "../../site.config";

/**
 * Cliente server-side de Supabase (SOLO build-time).
 *
 * - Usa la service role key desde env: NUNCA debe llegar al navegador
 *   (prohibido por PROJECT.md).
 * - El tenant se resuelve vía PUBLIC_TENANT_ID (un build por colegio).
 * - Si falta alguna variable (o es inválida), la web funciona con los
 *   fallbacks locales de src/data/fallback/ sin errores.
 *
 * Variables (ver .env.example):
 *   PUBLIC_SUPABASE_URL          → URL del proyecto (o siteConfig.supabase.url)
 *   SUPABASE_SERVICE_ROLE_KEY    → service role key (build-time)
 *   PUBLIC_TENANT_ID             → uuid del colegio en la tabla colegios
 */

export interface DbConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  tenantId: string;
}

export interface DbContext {
  client: SupabaseClient;
  config: DbConfig;
}

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getDbConfig(): DbConfig | null {
  const supabaseUrl =
    process.env.PUBLIC_SUPABASE_URL || siteConfig.supabase.url;
  const serviceRoleKey = process.env[siteConfig.supabase.serviceKeyEnvName];
  const tenantId = process.env.PUBLIC_TENANT_ID;

  if (!supabaseUrl || supabaseUrl === PLACEHOLDER_URL) return null;
  if (!serviceRoleKey) return null;

  if (!tenantId || !UUID_REGEX.test(tenantId)) {
    console.warn(
      "[db] PUBLIC_TENANT_ID no es un UUID válido; se usará el fallback local.",
    );
    return null;
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ""),
    serviceRoleKey,
    tenantId,
  };
}

export function isDbConfigured(): boolean {
  return getDbConfig() !== null;
}

let cachedContext: DbContext | null | undefined;

export function getDbContext(): DbContext | null {
  const config = getDbConfig();
  if (!config) return null;

  if (cachedContext === undefined) {
    cachedContext = {
      client: createClient(config.supabaseUrl, config.serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
      config,
    };
  }

  return cachedContext;
}
