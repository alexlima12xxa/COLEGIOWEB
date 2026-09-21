#!/usr/bin/env node
/**
 * scripts/grant-superadmin.mjs — Bootstrap del rol superadmin (uso único).
 * ---------------------------------------------------------------------------
 * ÚNICA vía para convertir a un usuario existente de Supabase Auth en
 * superadmin del panel de operación (/operador). No hay UI de auto-promoción
 * por diseño: el alta de colegios solo la autoriza un superadmin, y ese rol se
 * asigna exclusivamente con este script (ver reports/2026-09-21_alta-colegios-operador.md).
 *
 * Qué hace:
 *   1. Lee SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY del entorno.
 *   2. Busca el usuario por email (listUsers paginado).
 *   3. Fija app_metadata = { role: "superadmin" } (SIN tenant_id).
 *
 * Idempotente: si el usuario ya es superadmin, solo lo confirma.
 *
 * Uso:
 *   node scripts/grant-superadmin.mjs --email <email-del-dueno>
 *
 * Env vars requeridas:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * NOTA: tras ejecutar, el usuario debe CERRAR SESIÓN y volver a entrar para que
 * el nuevo app_metadata se refleje en su JWT (Supabase no regenera el token en
 * caliente).
 */

import { createClient } from "@supabase/supabase-js";

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(arg);
    }
  }
  return args;
}

// Busca un usuario por email con paginación (listUsers devuelve páginas de
// hasta 1000 usuarios). Devuelve el user o null si no existe.
async function findByEmail(supabase, email) {
  const needle = email.toLowerCase();
  const perPage = 1000;
  let page = 1;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) fail(`No se pudo listar usuarios: ${error.message}`);

    const users = data?.users ?? [];
    const found = users.find((u) => (u.email ?? "").toLowerCase() === needle);
    if (found) return found;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email;
  if (!email) {
    fail("Uso: node scripts/grant-superadmin.mjs --email <email-del-dueno>");
  }

  const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) fail("Falta SUPABASE_URL (o PUBLIC_SUPABASE_URL).");
  if (!serviceKey) fail("Falta SUPABASE_SERVICE_ROLE_KEY.");

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const user = await findByEmail(supabase, email);
  if (!user) {
    fail(
      `No existe un usuario de Auth con email "${email}". ` +
        "Crea la cuenta primero (login/registro) y vuelve a correr este script.",
    );
  }

  if (user.app_metadata?.role === "superadmin") {
    console.log(`\n✓ "${email}" ya es superadmin (id ${user.id}). Nada que hacer.`);
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { role: "superadmin" },
  });

  if (error) fail(`No se pudo actualizar el usuario: ${error.message}`);

  console.log(`\n✓ Superadmin asignado: ${data.user.email} (id ${data.user.id})`);
  console.log(`  app_metadata: ${JSON.stringify(data.user.app_metadata)}`);
  console.log("\nIMPORTANTE: cierra sesión y vuelve a entrar para que el JWT");
  console.log("refleje el nuevo rol (Supabase no regenera el token en caliente).");
}

main().catch((err) => {
  console.error("\n❌ Error inesperado:", err);
  process.exit(1);
});
