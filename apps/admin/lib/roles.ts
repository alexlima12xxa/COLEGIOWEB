import type { User } from "@supabase/supabase-js";

// Funciones puras de autorización por rol, compartidas entre el edge runtime
// (proxy.ts) y Node (login/actions.ts, lib/auth.ts). SOLO importan tipos: no
// pueden usar node:* ni next/headers.
//
// Contrato de roles (ver reports/2026-09-21_alta-colegios-operador.md):
//   - superadmin:      app_metadata.role = 'superadmin' (sin tenant_id).
//   - admin (director):app_metadata.role = 'admin' + app_metadata.tenant_id.
//   - cualquier otro:  sin acceso (la raíz muestra el esqueleto).

export function isSuperadmin(user: User | null): boolean {
  return user?.app_metadata?.role === "superadmin";
}

export function isAdminWithTenant(user: User | null): boolean {
  return user?.app_metadata?.role === "admin" && !!user?.app_metadata?.tenant_id;
}

// Destino "natural" tras autenticar, según el rol del usuario.
// Sin rol válido → "/" (evita loops de redirect en el proxy).
export function getPostLoginPath(user: User | null): string {
  if (isSuperadmin(user)) return "/operador";
  if (isAdminWithTenant(user)) return "/admin";
  return "/";
}

// Resuelve el destino post-login respetando un `next` interno SÓLO si es del
// mismo plano que el rol del usuario. Un `next` de otro plano se reemplaza por
// el home del rol; las rutas externas/ambiguas se descartan (anti open-redirect).
export function resolvePostLoginPath(
  user: User | null,
  requested: unknown,
): string {
  const home = getPostLoginPath(user);

  if (
    typeof requested !== "string" ||
    !requested.startsWith("/") ||
    requested.startsWith("//") ||
    requested.startsWith("/\\")
  ) {
    return home;
  }

  const requestedPlane = planeOf(requested);
  const homePlane = planeOf(home);

  if (requestedPlane !== "other" && requestedPlane !== homePlane) {
    return home;
  }

  return requested;
}

function planeOf(path: string): "operator" | "admin" | "other" {
  if (path.startsWith("/operador")) return "operator";
  if (path.startsWith("/admin")) return "admin";
  return "other";
}
