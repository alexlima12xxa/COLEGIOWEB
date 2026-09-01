"use client";

import { useActionState } from "react";
import type { ContenidoState } from "./actions";
import { guardarMision, guardarFilosofia, guardarHistoria } from "./actions";

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

interface MisionVisionData {
  mision?: string;
  vision?: string;
}

export function MisionVisionForm({ initial }: { initial: MisionVisionData }) {
  const [state, formAction, pending] = useActionState<ContenidoState, FormData>(
    guardarMision,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="mision" className="block text-sm font-medium text-zinc-700">
          Misión <span className="text-red-600">*</span>
        </label>
        <textarea
          id="mision"
          name="mision"
          rows={4}
          defaultValue={initial.mision ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">Entre 20 y 1000 caracteres.</p>
        <FieldError message={state.fieldErrors?.mision} />
      </div>

      <div>
        <label htmlFor="vision" className="block text-sm font-medium text-zinc-700">
          Visión <span className="text-red-600">*</span>
        </label>
        <textarea
          id="vision"
          name="vision"
          rows={4}
          defaultValue={initial.vision ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">Entre 20 y 1000 caracteres.</p>
        <FieldError message={state.fieldErrors?.vision} />
      </div>

      {state.ok ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Misión y visión guardadas. Aparecerán en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar misión y visión" />
    </form>
  );
}

interface FilosofiaItem {
  title?: string;
  description?: string;
}

export function FilosofiaForm({ initial }: { initial: FilosofiaItem[] }) {
  const [state, formAction, pending] = useActionState<ContenidoState, FormData>(
    guardarFilosofia,
    {},
  );
  const items = initial.length > 0 ? initial : [{ title: "", description: "" }];

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-5">
        {items.map((item, i) => (
          <fieldset key={i} className="space-y-3 rounded-lg border border-zinc-200 p-4">
            <legend className="sr-only">Pilar {i + 1}</legend>
            <div>
              <label htmlFor={`title-${i}`} className="block text-sm font-medium text-zinc-700">
                Título del pilar <span className="text-red-600">*</span>
              </label>
              <input
                id={`title-${i}`}
                name="title"
                type="text"
                defaultValue={item.title ?? ""}
                className={inputClass}
              />
              <FieldError message={state.fieldErrors?.[`title-${i}`]} />
            </div>
            <div>
              <label htmlFor={`description-${i}`} className="block text-sm font-medium text-zinc-700">
                Descripción <span className="text-red-600">*</span>
              </label>
              <textarea
                id={`description-${i}`}
                name="description"
                rows={3}
                defaultValue={item.description ?? ""}
                className={inputClass}
              />
              <FieldError message={state.fieldErrors?.[`description-${i}`]} />
            </div>
          </fieldset>
        ))}
      </div>

      {state.fieldErrors?._form ? <FormError message={state.fieldErrors._form} /> : null}
      {state.ok ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Filosofía guardada. Aparecerá en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar filosofía" />
    </form>
  );
}

interface HistoriaItem {
  title?: string;
  date?: string;
  description?: string;
}

export function HistoriaForm({ initial }: { initial: HistoriaItem[] }) {
  const [state, formAction, pending] = useActionState<ContenidoState, FormData>(
    guardarHistoria,
    {},
  );
  const items = initial.length > 0 ? initial : [{ title: "", date: "", description: "" }];

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-5">
        {items.map((item, i) => (
          <fieldset key={i} className="space-y-3 rounded-lg border border-zinc-200 p-4">
            <legend className="sr-only">Hito {i + 1}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr]">
              <div>
                <label htmlFor={`anio-${i}`} className="block text-sm font-medium text-zinc-700">
                  Año <span className="text-red-600">*</span>
                </label>
                <input
                  id={`anio-${i}`}
                  name="anio"
                  type="text"
                  defaultValue={item.date ?? ""}
                  placeholder="1985"
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`anio-${i}`]} />
              </div>
              <div>
                <label htmlFor={`titulo-${i}`} className="block text-sm font-medium text-zinc-700">
                  Título del hito <span className="text-red-600">*</span>
                </label>
                <input
                  id={`titulo-${i}`}
                  name="titulo"
                  type="text"
                  defaultValue={item.title ?? ""}
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`titulo-${i}`]} />
              </div>
            </div>
            <div>
              <label htmlFor={`descripcion-${i}`} className="block text-sm font-medium text-zinc-700">
                Descripción <span className="text-red-600">*</span>
              </label>
              <textarea
                id={`descripcion-${i}`}
                name="descripcion"
                rows={3}
                defaultValue={item.description ?? ""}
                className={inputClass}
              />
              <FieldError message={state.fieldErrors?.[`descripcion-${i}`]} />
            </div>
          </fieldset>
        ))}
      </div>

      {state.fieldErrors?._form ? <FormError message={state.fieldErrors._form} /> : null}
      {state.ok ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Historia guardada. Aparecerá en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar historia" />
    </form>
  );
}
