"use client";

import { useActionState, useState } from "react";
import { resetPassword, type ResetPasswordState } from "./actions";
import { EyeIcon, EyeOffIcon } from "@/app/admin/components/icons";

const initialState: ResetPasswordState = {};

function PasswordInput({
  id,
  name,
  label,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          placeholder="••••••••"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pr-11 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 transition hover:text-zinc-600"
        >
          {show ? (
            <EyeOffIcon className="h-5 w-5" />
          ) : (
            <EyeIcon className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    resetPassword,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <PasswordInput
        id="password"
        name="password"
        label="Nueva contraseña"
        autoComplete="new-password"
      />
      <PasswordInput
        id="confirm"
        name="confirm"
        label="Confirmar contraseña"
        autoComplete="new-password"
      />

      <p className="text-xs leading-5 text-zinc-500">
        Mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un
        número y un símbolo.
      </p>

      {state.error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar contraseña"}
      </button>
    </form>
  );
}
