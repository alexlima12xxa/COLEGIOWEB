"use client";

import { useActionState, useEffect, useState } from "react";
import {
  forgotPassword,
  login,
  type ForgotPasswordState,
  type LoginState,
} from "./actions";
import { EyeIcon, EyeOffIcon } from "@/app/admin/components/icons";

const initialLoginState: LoginState = {};
const initialForgotState: ForgotPasswordState = {};

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, initialLoginState);
  const [forgotState, forgotFormAction, forgotPending] = useActionState(
    forgotPassword,
    initialForgotState,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Cierre del modal con la tecla Escape.
  useEffect(() => {
    if (!forgotOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setForgotOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forgotOpen]);

  return (
    <>
      <form action={formAction} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={next ?? ""} />
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700"
          >
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="director@colegio.edu"
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700"
          >
            Contraseña
          </label>
          <div className="relative mt-1.5">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 pr-11 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 transition hover:text-zinc-600"
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-sm font-medium text-blue-700 transition hover:text-blue-800"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

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
          {pending ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      {forgotOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setForgotOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2
                id="forgot-title"
                className="text-lg font-semibold text-zinc-900"
              >
                Recuperar contraseña
              </h2>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                aria-label="Cerrar"
                className="-mr-1 rounded-lg px-2 py-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Escribe tu correo y te enviaremos un enlace para crear una nueva
              contraseña.
            </p>

            <form action={forgotFormAction} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Correo electrónico
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="director@colegio.edu"
                  className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              {forgotState.error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
                >
                  {forgotState.error}
                </p>
              ) : null}

              {forgotState.success ? (
                <p
                  role="status"
                  className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-700"
                >
                  {forgotState.success}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={forgotPending || !!forgotState.success}
                className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {forgotPending ? "Enviando…" : "Enviar enlace"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
