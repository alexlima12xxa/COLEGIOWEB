"use client";

import { useActionState, useState } from "react";
import type { GaleriaState } from "./actions";
import { guardarGaleria } from "./actions";
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

export interface GaleriaItem {
  src?: string;
  alt?: string;
  title?: string;
  category?: string;
  order?: number;
}

export function GaleriaForm({ initial }: { initial: GaleriaItem[] }) {
  const [state, formAction, pending] = useActionState<GaleriaState, FormData>(
    guardarGaleria,
    {},
  );
  const [items, setItems] = useState<GaleriaItem[]>(
    initial.length > 0 ? initial : [{ alt: "", title: "", category: "", order: undefined }],
  );
  const [previews, setPreviews] = useState<(string | undefined)[]>(
    items.map((item) => mediaUrl(item.src)),
  );

  const addItem = () => {
    setItems((prev) => [...prev, { alt: "", title: "", category: "", order: undefined }]);
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
            <legend className="sr-only">Imagen {i + 1}</legend>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`title-${i}`} className="block text-sm font-medium text-zinc-700">
                  Título
                </label>
                <input
                  id={`title-${i}`}
                  name="title"
                  type="text"
                  defaultValue={item.title ?? ""}
                  placeholder="Ej. Clase de arte"
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`title-${i}`]} />
              </div>
              <div>
                <label htmlFor={`category-${i}`} className="block text-sm font-medium text-zinc-700">
                  Categoría
                </label>
                <input
                  id={`category-${i}`}
                  name="category"
                  type="text"
                  defaultValue={item.category ?? ""}
                  placeholder="Ej. Académico, Deportes, Eventos"
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`category-${i}`]} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`alt-${i}`} className="block text-sm font-medium text-zinc-700">
                  Texto alternativo (alt)
                </label>
                <input
                  id={`alt-${i}`}
                  name="alt"
                  type="text"
                  defaultValue={item.alt ?? ""}
                  placeholder="Descripción breve para accesibilidad"
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`alt-${i}`]} />
              </div>
              <div>
                <label htmlFor={`order-${i}`} className="block text-sm font-medium text-zinc-700">
                  Orden
                </label>
                <input
                  id={`order-${i}`}
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={item.order ?? ""}
                  placeholder="0"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-500">Menor = aparece primero.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="block text-sm font-medium text-zinc-700">Imagen</span>
                <input
                  id={`image-${i}`}
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(e) => handleFile(i, e)}
                  className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
                />
                <input type="hidden" name="image_path" value={item.src ?? ""} />
                <p className="mt-1 text-xs text-zinc-500">
                  {item.src ? "Imagen actual: ver previsualización." : "Sube una imagen (JPG, PNG, WebP o AVIF)."}
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
                  alt={`Vista previa de ${item.title ?? "la imagen"}`}
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
        + Agregar imagen
      </button>

      {state.fieldErrors?._form ? <FormError message={state.fieldErrors._form} /> : null}
      {state.ok ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Galería guardada. Aparecerá en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar galería" />
    </form>
  );
}
