import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Lista el estado de las claves de `contenido` de un módulo editorial.
// La query pasa por RLS (current_tenant_id): el director solo ve las claves
// de SU colegio.
export async function ContentKeysStatus({
  supabase,
  claves,
}: {
  supabase: SupabaseClient;
  claves: readonly string[];
}) {
  const { data, error } = await supabase
    .from("contenido")
    .select("clave, updated_at")
    .in("clave", [...claves])
    .order("clave");

  const defined = new Set((data ?? []).map((row) => row.clave));
  const definedCount = claves.filter((clave) => defined.has(clave)).length;
  const total = claves.length;
  const complete = definedCount === total;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={
            complete
              ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
              : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
          }
        >
          {complete ? "Completo" : "Incompleto"}
        </span>
        <span className="text-sm text-zinc-600">
          {definedCount}/{total} claves definidas
        </span>
      </div>

      <ul className="divide-y divide-zinc-200">
        {claves.map((clave) => {
          const isDefined = defined.has(clave);
          return (
            <li
              key={clave}
              className="flex items-center justify-between gap-4 py-2.5 text-sm"
            >
              <span className="font-medium text-zinc-900">{clave}</span>
              <span
                className={
                  isDefined ? "text-zinc-600" : "font-medium text-amber-700"
                }
              >
                {isDefined ? "Definida" : "Pendiente"}
              </span>
            </li>
          );
        })}
      </ul>
      {error ? (
        <p className="mt-3 text-sm text-red-700">No se pudo leer el módulo.</p>
      ) : null}
    </div>
  );
}
