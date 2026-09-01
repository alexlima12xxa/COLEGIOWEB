"use client";

import { useActionState } from "react";
import type { NivelesState } from "./actions";
import { guardarNiveles, NIVELES } from "./actions";

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </p>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando…" : label}
    </button>
  );
}

export interface NivelData {
  description?: string;
  ageRange?: string;
  cta?: string;
}

export function NivelesForm({ initial }: { initial: Record<string, NivelData> }) {
  const [state, formAction, pending] = useActionState<NivelesState, FormData>(
    guardarNiveles,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-5">
        {NIVELES.map((nivel) => {
          const data = initial[nivel.clave] ?? {};
          return (
            <fieldset
              key={nivel.clave}
              className="space-y-3 rounded-lg border border-zinc-200 p-4"
            >
              <legend className="text-sm font-semibold text-zinc-900">
                {nivel.label}
              </legend>

              <div>
                <label
                  htmlFor={`${nivel.clave}_description`}
                  className="block text-sm font-medium text-zinc-700"
                >
                  Descripción <span className="text-red-600">*</span>
                </label>
                <textarea
                  id={`${nivel.clave}_description`}
                  name={`${nivel.clave}_description`}
                  rows={3}
                  defaultValue={data.description ?? ""}
                  placeholder="Descripción del nivel educativo."
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-500">Entre 10 y 500 caracteres.</p>
                <FieldError message={state.fieldErrors?.[`${nivel.clave}_description`]} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`${nivel.clave}_ageRange`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Edad
                  </label>
                  <input
                    id={`${nivel.clave}_ageRange`}
                    name={`${nivel.clave}_ageRange`}
                    type="text"
                    defaultValue={data.ageRange ?? ""}
                    placeholder="Ej. 3-5 años"
                    className={inputClass}
                  />
                  <FieldError message={state.fieldErrors?.[`${nivel.clave}_ageRange`]} />
                </div>
                <div>
                  <label
                    htmlFor={`${nivel.clave}_cta`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    CTA (llamado a la acción)
                  </label>
                  <input
                    id={`${nivel.clave}_cta`}
                    name={`${nivel.clave}_cta`}
                    type="text"
                    defaultValue={data.cta ?? ""}
                    placeholder="Ej. Conoce el proceso de admisión"
                    className={inputClass}
                  />
                  <FieldError message={state.fieldErrors?.[`${nivel.clave}_cta`]} />
                </div>
              </div>
            </fieldset>
          );
        })}
      </div>

      {state.ok ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Niveles guardados. Aparecerán en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar niveles" />
    </form>
  );
}
