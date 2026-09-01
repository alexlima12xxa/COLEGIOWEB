"use client";

import { useRef, useState } from "react";
import { eliminarCircular } from "./actions";

export function DeleteCircularButton({
  id,
  titulo,
}: {
  id: string;
  titulo: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-zinc-500">¿Eliminar?</span>
        <form ref={formRef} action={eliminarCircular}>
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            className="rounded-lg bg-red-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-red-800"
          >
            Sí
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          No
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Eliminar circular "${titulo}"`}
      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
    >
      Eliminar
    </button>
  );
}