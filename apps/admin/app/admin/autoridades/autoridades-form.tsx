"use client";

import { useActionState, useState } from "react";
import type { AutoridadesState } from "./actions";
import { guardarAutoridades } from "./actions";
import { mediaUrl } from "@/lib/storage";

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

export interface AutoridadItem {
  name?: string;
  role?: string;
  image?: string;
  bio?: string;
}

export function AutoridadesForm({ initial }: { initial: AutoridadItem[] }) {
  const [state, formAction, pending] = useActionState<AutoridadesState, FormData>(
    guardarAutoridades,
    {},
  );
  const [items, setItems] = useState<AutoridadItem[]>(
    initial.length > 0 ? initial : [{ name: "", role: "", bio: "" }],
  );
  const [previews, setPreviews] = useState<(string | undefined)[]>(
    items.map((item) => mediaUrl(item.image)),
  );

  const addItem = () => {
    setItems((prev) => [...prev, { name: "", role: "", bio: "" }]);
    setPreviews((prev) => [...prev, undefined]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFile = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setPreviews((prev) => {
        const next = [...prev];
        next[index] = reader.result as string;
        return next;
      });
    reader.readAsDataURL(file);
  };

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-5">
        {items.map((item, i) => (
          <fieldset
            key={i}
            className="space-y-3 rounded-lg border border-zinc-200 p-4"
          >
            <legend className="sr-only">Autoridad {i + 1}</legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`name-${i}`} className="block text-sm font-medium text-zinc-700">
                  Nombre <span className="text-red-600">*</span>
                </label>
                <input
                  id={`name-${i}`}
                  name="name"
                  type="text"
                  defaultValue={item.name ?? ""}
                  placeholder="Ej. Dra. Carolina Mendoza"
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`name-${i}`]} />
              </div>
              <div>
                <label htmlFor={`role-${i}`} className="block text-sm font-medium text-zinc-700">
                  Cargo <span className="text-red-600">*</span>
                </label>
                <input
                  id={`role-${i}`}
                  name="role"
                  type="text"
                  defaultValue={item.role ?? ""}
                  placeholder="Ej. Rectora"
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`role-${i}`]} />
              </div>
            </div>

            <div>
              <label htmlFor={`bio-${i}`} className="block text-sm font-medium text-zinc-700">
                Bio
              </label>
              <textarea
                id={`bio-${i}`}
                name="bio"
                rows={3}
                defaultValue={item.bio ?? ""}
                placeholder="Breve semblanza de la autoridad (opcional)."
                className={inputClass}
              />
              <FieldError message={state.fieldErrors?.[`bio-${i}`]} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-sm font-medium text-zinc-700">Foto</span>
                <input
                  id={`image-${i}`}
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => handleFile(i, e)}
                  className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
                />
                <input type="hidden" name="image_path" value={item.image ?? ""} />
                <p className="mt-1 text-xs text-zinc-500">
                  {item.image ? "Foto actual: ver previsualización." : "Sube una foto (JPG, PNG, WebP o AVIF)."}
                </p>
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {previews[i] ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previews[i]}
                  alt={`Vista previa de ${item.name ?? "la autoridad"}`}
                  className="h-40 w-full rounded-lg object-cover ring-1 ring-zinc-200"
                />
              </div>
            ) : null}
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
      >
        + Agregar autoridad
      </button>

      {state.fieldErrors?._form ? <FormError message={state.fieldErrors._form} /> : null}
      {state.ok ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Autoridades guardadas. Aparecerán en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar autoridades" />
    </form>
  );
}
