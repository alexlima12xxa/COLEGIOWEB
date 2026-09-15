"use client";

import { useState, useTransition } from "react";
import { eliminarLeads } from "./actions";

interface LeadDeleteButtonProps {
  id: string;
  nombre: string;
}

// Borrado individual con confirmación en línea (mismo patrón que Noticias y
// Circulares). Reutiliza la Server Action `eliminarLeads` con un único id.
export function LeadDeleteButton({ id, nombre }: LeadDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await eliminarLeads([id]);
      setConfirming(false);
    });
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-zinc-500">¿Eliminar?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg bg-red-700 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-800 disabled:opacity-50"
        >
          {isPending ? "Eliminando…" : "Sí"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
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
      aria-label={`Eliminar la solicitud de ${nombre}`}
      className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
    >
      Eliminar
    </button>
  );
}
