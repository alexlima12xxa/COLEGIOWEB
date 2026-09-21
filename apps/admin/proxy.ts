import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  getPostLoginPath,
  isAdminWithTenant,
  isSuperadmin,
} from "@/lib/roles";

// Proxy de protección de rutas (Next 16 — reemplaza a middleware).
// - Refresca la sesión Supabase en cada request y valida el JWT (getUser).
// - /admin y /admin/* requieren rol admin + tenant (plano del director).
// - /operador y /operador/* requieren rol superadmin (plano del operador).
// - /login con sesión y / (raíz) redirigen según el rol del usuario.
export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isLoggedIn = !!user;

  const isRootRoute = pathname === "/";
  const isLoginRoute = pathname === "/login";
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isOperatorRoute =
    pathname === "/operador" || pathname.startsWith("/operador/");

  // Raíz sin sesión → /login (comportamiento original).
  if (isRootRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Rutas protegidas sin sesión → /login, preservando el destino en `next`.
  if ((isAdminRoute || isOperatorRoute) && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // /operador sin rol superadmin → a su propio plano (admin → /admin).
  if (isOperatorRoute && !isSuperadmin(user)) {
    return NextResponse.redirect(
      new URL(isAdminWithTenant(user) ? "/admin" : "/", request.url),
    );
  }

  // /admin sin rol admin + tenant → "/" (sin cambios; un superadmin que entra
  // aquí converge a /operador vía la regla de raíz).
  if (isAdminRoute && !isAdminWithTenant(user)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Raíz con sesión → al plano del rol (evita loop si no hay rol válido).
  if (isRootRoute && isLoggedIn) {
    const dest = getPostLoginPath(user);
    if (dest !== "/") {
      return NextResponse.redirect(new URL(dest, request.url));
    }
  }

  // /login con sesión → al plano del rol.
  if (isLoginRoute && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = getPostLoginPath(user);
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
