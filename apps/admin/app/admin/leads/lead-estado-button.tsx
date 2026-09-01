"use client";

import { useTransition } from "react";
import { cambiarEstadoLead } from "./actions";
import { ESTADO_LABEL, ESTADO_SIGUIENTE, type LeadEstado } from "./leads-constants";

interface LeadEstadoButtonProps {
  id: string;
  estado: string;
}

export function LeadEstadoButton({ id, estado }: LeadEstadoButtonProps) {
  const [isPending, startTransition] = useTransition();
  const estadoVal = estado as LeadEstado;
  const siguiente = ESTADO_SIGUIENTE[estadoVal];

  if (!siguiente) {
    return (
      <span className="text-xs text-zinc-400" aria-label="Estado final">
        Finalizado
      </span>
    );
  }

  return (
    <form
      action={(formData) => {
        formData.set("id", id);
        formData.set("estado", estado);
        startTransition(() => cambiarEstadoLead(formData));
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
      >
        {isPending
          ? "Actualizando…"
          : `Marcar como ${ESTADO_LABEL[siguiente].toLowerCase()}`}
      </button>
    </form>
  );
}
