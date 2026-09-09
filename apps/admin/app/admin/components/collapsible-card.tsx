"use client";

import { useState } from "react";
import type { ReactNode } from "react";

// Tarjeta de sección colapsable reutilizable del panel.
// Cabecera como botón con semántica de disclosure: aria-expanded,
// aria-controls y aria-labelledby. Por defecto el panel solo se monta cuando
// está abierto; con keepMounted se mantiene montado (pero oculto con `hidden`)
// para que los campos de un <form> externo sigan existiendo al guardar.
export function CollapsibleCard({
  id,
  title,
  defaultOpen = false,
  keepMounted = false,
  children,
}: {
  id: string;
  title: string;
  defaultOpen?: boolean;
  keepMounted?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `${id}-panel`;

  return (
    <section
      aria-labelledby={id}
      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40"
      >
        <h2
          id={id}
          className="text-sm font-medium uppercase tracking-wide text-zinc-600"
        >
          {title}
        </h2>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {keepMounted ? (
        <div id={panelId} hidden={!open} className="border-t border-zinc-200 px-6 py-5">
          {children}
        </div>
      ) : open ? (
        <div id={panelId} className="border-t border-zinc-200 px-6 py-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}