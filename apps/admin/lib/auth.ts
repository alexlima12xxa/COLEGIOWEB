import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Requiere una sesión de administrador y devuelve el cliente Supabase
// autenticado junto con el tenant (colegio) del usuario.
//
// - Sin sesión → /login (aceptación GATE A2: rutas protegidas redirigen).
// - Con sesión pero sin rol `admin` (app_metadata.role) o sin tenant
//   (app_metadata.tenant_id) → "/" (sin acceso al panel).
//
// app_metadata lo fija Supabase (no es editable por el usuario final) y es la
// MISMA fuente de autorización que usa RLS en la BD (public.is_admin() y
// public.current_tenant_id()). Cada query posterior pasa por este cliente,
// así que RLS aísla SIEMPRE los datos al tenant del director.
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.app_metadata?.role as string | undefined;
  const tenantId = user.app_metadata?.tenant_id as string | undefined;

  if (role !== "admin" || !tenantId) {
    redirect("/");
  }

  return { supabase, user, tenantId };
}
