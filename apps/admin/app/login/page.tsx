import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión — Panel Admin",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

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

        <LoginForm next={next} />
      </div>
    </main>
  );
}
