import { logout } from "@/app/login/actions";
import { requireSuperadmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Layout del plano operador (/operador).
// - Verifica rol superadmin (requireSuperadmin → defensa en profundidad junto
//   al proxy). Sin sesión → /login; sin rol superadmin → /admin.
// - El superadmin no tiene tenant: este plano opera cross-tenant con service_role.
export default async function OperadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireSuperadmin();

  return (
    <div className="min-h-svh bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-base font-semibold text-zinc-900">
              Operador
            </p>
            <span className="hidden rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 sm:inline">
              Alta de colegios
            </span>
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
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
