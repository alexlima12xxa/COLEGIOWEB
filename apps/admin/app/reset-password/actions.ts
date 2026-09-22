"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ResetPasswordState = {
  error?: string;
};

const MIN_PASSWORD_LENGTH = 8;
// Al menos: 1 minúscula, 1 mayúscula, 1 dígito y 1 símbolo.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

// Server Action para fijar la nueva contraseña (flujos recovery e invite).
// Requiere una sesión válida (la establece /auth/confirm vía verifyOtp).
export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "El enlace no es válido o caducó. Solicita uno nuevo.",
    };
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      error:
        "Debe incluir al menos una mayúscula, una minúscula, un número y un símbolo.",
    };
  }

  if (password !== confirm) {
    return { error: "Las contraseñas no coinciden." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      error: "No pudimos actualizar la contraseña. Inténtalo de nuevo.",
    };
  }

  // Revoca todas las sesiones (incluida la de recovery) y vuelve a /login.
  await supabase.auth.signOut({ scope: "global" });

  revalidatePath("/", "layout");
  redirect("/login?reset=1");
}
