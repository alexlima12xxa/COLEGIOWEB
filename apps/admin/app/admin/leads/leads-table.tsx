"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { eliminarLeads } from "./actions";
import { LeadDeleteButton } from "./lead-delete-button";
import { LeadEstadoButton } from "./lead-estado-button";
import { ESTADO_BADGE, ESTADO_LABEL, type LeadEstado } from "./leads-constants";

export interface LeadRow {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  nivel_interes: string | null;
  mensaje: string | null;
  estado: string;
  created_at: string;
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allSelected = leads.length > 0 && selected.size === leads.length;
  const someSelected = selected.size > 0 && !allSelected;

  // Estado "indeterminado" del checkbox maestro (selección parcial).
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  // Cierra el diálogo de confirmación con Escape.
  useEffect(() => {
    if (!confirming) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirming(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirming]);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(selected);
    startTransition(async () => {
      await eliminarLeads(ids);
      setSelected(new Set());
      setConfirming(false);
    });
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
          <p className="text-sm font-medium text-red-800">
            {selected.size}{" "}
            {selected.size === 1 ? "lead seleccionado" : "leads seleccionados"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800"
            >
              Eliminar seleccionados
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
              <th className="w-10 py-2 pr-2">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Seleccionar todos los leads de la lista"
                  className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-blue-700 focus:ring-blue-500"
                />
              </th>
              <th className="py-2 pr-4 font-medium">Nombre</th>
              <th className="py-2 pr-4 font-medium">Contacto</th>
              <th className="py-2 pr-4 font-medium">Nivel</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
              <th className="py-2 pr-4 font-medium">Fecha</th>
              <th className="py-2 font-medium">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className={`align-top transition ${
                  selected.has(lead.id) ? "bg-blue-50/60" : ""
                }`}
              >
                <td className="py-3 pr-2">
                  <input
                    type="checkbox"
                    checked={selected.has(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                    aria-label={`Seleccionar la solicitud de ${lead.nombre}`}
                    className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-blue-700 focus:ring-blue-500"
                  />
                </td>
                <td className="py-3 pr-4">
                  <p className="font-semibold text-zinc-900">{lead.nombre}</p>
                  {lead.mensaje ? (
                    <p className="mt-0.5 line-clamp-2 max-w-xs text-xs text-zinc-500">
                      {lead.mensaje}
                    </p>
                  ) : null}
                </td>
                <td className="py-3 pr-4">
                  <p className="text-zinc-700">{lead.email}</p>
                  {lead.telefono ? (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {lead.telefono}
                    </p>
                  ) : null}
                </td>
                <td className="py-3 pr-4 text-zinc-700">
                  {lead.nivel_interes ?? "—"}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ESTADO_BADGE[lead.estado as LeadEstado] ??
                      "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {ESTADO_LABEL[lead.estado as LeadEstado] ?? lead.estado}
                  </span>
                </td>
                <td className="py-3 pr-4 text-zinc-700">
                  {new Date(lead.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <LeadEstadoButton id={lead.id} estado={lead.estado} />
                    <LeadDeleteButton id={lead.id} nombre={lead.nombre} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirming ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leads-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setConfirming(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3
              id="leads-delete-title"
              className="text-lg font-semibold text-zinc-900"
            >
              Eliminar {selected.size}{" "}
              {selected.size === 1 ? "solicitud" : "solicitudes"}
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Esta acción borrará permanentemente{" "}
              {selected.size === 1 ? "la solicitud" : "las solicitudes"}{" "}
              seleccionada{selected.size === 1 ? "" : "s"} y no se puede
              deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isPending}
                autoFocus
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50"
              >
                {isPending ? "Eliminando…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
