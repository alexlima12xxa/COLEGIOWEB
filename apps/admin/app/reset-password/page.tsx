import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Nueva contraseña — Panel Admin",
};

// Página de destino del enlace de email (recovery / invite). Exige la sesión
// que establece /auth/confirm con verifyOtp(); sin ella, vuelve a /login.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=enlace");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
            @web-modelo/admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            Crea tu nueva contraseña
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Define una contraseña segura para tu cuenta.
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </main>
  );
}
