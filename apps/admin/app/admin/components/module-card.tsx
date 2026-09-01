import type { ReactNode } from "react";

// Tarjeta de sección reutilizable del panel. `id` etiqueta el <section> para
// que el landmark tenga nombre accesible (aria-labelledby).
export function ModuleCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <h2
        id={id}
        className="text-sm font-medium uppercase tracking-wide text-zinc-600"
      >
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
