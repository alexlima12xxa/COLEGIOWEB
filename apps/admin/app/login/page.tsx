import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión — Panel Admin",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; error?: string }>;
}) {
  const { next, reset, error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
            @web-modelo/admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            Panel de administración
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Ingresa con tu cuenta de administrador del colegio.
          </p>
        </div>

        {reset ? (
          <p
            role="status"
            className="mt-6 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700"
          >
            Tu contraseña se actualizó. Inicia sesión con la nueva.
          </p>
        ) : null}

        {error === "enlace" ? (
          <p
            role="alert"
            className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          >
            El enlace no es válido o caducó. Solicita uno nuevo.
          </p>
        ) : null}

        <LoginForm next={next} />
      </div>
    </main>
  );
}
