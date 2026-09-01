import { logout } from "@/app/login/actions";
import { requireAdmin } from "@/lib/auth";
import Sidebar from "./components/sidebar";
import { GraduationCapIcon, LogOutIcon } from "./components/icons";

export const dynamic = "force-dynamic";

// Layout del área protegida /admin.
// - Verifica sesión + rol admin (requireAdmin → defensa en profundidad junto
//   al proxy). Sin sesión → /login; sin rol admin → /.
// - Carga el colegio (tenant) del usuario: la query pasa por RLS, así que
//   cada director SOLO ve su colegio, nunca otro.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, tenantId } = await requireAdmin();

  const { data: colegio } = await supabase
    .from("colegios")
    .select("nombre, slug")
    .eq("id", tenantId)
    .maybeSingle();

  return (
    <div className="min-h-svh bg-zinc-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-blue-700 focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-700 text-white"
              aria-hidden="true"
            >
              <GraduationCapIcon className="h-5 w-5" />
            </div>
            <p className="truncate text-base font-semibold text-zinc-900">
              {colegio?.nombre ?? "Panel de administración"}
            </p>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-4">
            <span className="hidden truncate text-sm text-zinc-600 md:inline">
              {user.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <LogOutIcon className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
