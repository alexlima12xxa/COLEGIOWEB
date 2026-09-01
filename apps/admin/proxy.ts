import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Proxy de protección de rutas (Next 16 — reemplaza a middleware).
// - Refresca la sesión Supabase en cada request y valida el JWT (getUser).
// - /admin y /admin/* requieren sesión → redirigen a /login si no hay.
// - /admin y /admin/* requieren rol admin (app_metadata.role === 'admin') y
//   tenant asignado → sin eso, el usuario no tiene acceso al panel.
// - /login con sesión de admin → redirige a /admin.
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isLoggedIn = !!user;
  const isAdmin = isLoggedIn && user.app_metadata?.role === "admin";
  const hasTenant = isAdmin && !!user.app_metadata?.tenant_id;

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginRoute = pathname === "/login";

  if (isAdminRoute && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Sesión iniciada pero sin rol admin (o sin tenant): sin acceso al panel.
  if (isAdminRoute && !hasTenant) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isLoginRoute && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = hasTenant ? "/admin" : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
