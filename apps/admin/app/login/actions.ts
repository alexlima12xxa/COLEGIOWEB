"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolvePostLoginPath } from "@/lib/roles";

export type LoginState = {
  error?: string;
};

export type ForgotPasswordState = {
  error?: string;
  success?: string;
};

// Resuelve el origen público de la app para construir el enlace de recovery.
// Prefiere NEXT_PUBLIC_APP_URL (fijo en producción) y cae a las cabeceras del
// request (dev / previews).
async function resolveOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin.replace(/\/$/, "");

  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

// Server Action de login: valida credenciales contra Supabase Auth.
// En éxito redirige según el rol del usuario (superadmin → /operador,
// admin+tenant → /admin), respetando un `next` interno del mismo plano.
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Credenciales inválidas. Verifica tu correo y contraseña." };
  }

  revalidatePath("/", "layout");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(resolvePostLoginPath(user, next));
}

// Server Action de "olvidé mi contraseña": dispara el correo de recuperación de
// Supabase Auth. La respuesta es SIEMPRE genérica para no revelar si el correo
// existe (anti user-enumeration).
export async function forgotPassword(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Ingresa tu correo electrónico." };
  }

  const origin = await resolveOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm`,
  });

  if (error) {
    return {
      error: "No pudimos enviar el correo. Inténtalo de nuevo en unos minutos.",
    };
  }

  return {
    success:
      "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.",
  };
}

// Server Action de logout: cierra la sesión y vuelve a /login.
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
