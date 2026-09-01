"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ESTADOS, ESTADO_LABEL, NIVELES } from "./leads-constants";

interface LeadsFiltersProps {
  estado?: string;
  nivel?: string;
  desde?: string;
  hasta?: string;
}

export function LeadsFilters({ estado, nivel, desde, hasta }: LeadsFiltersProps) {
  const router = useRouter();
  const [estadoVal, setEstadoVal] = useState(estado ?? "");
  const [nivelVal, setNivelVal] = useState(nivel ?? "");
  const [desdeVal, setDesdeVal] = useState(desde ?? "");
  const [hastaVal, setHastaVal] = useState(hasta ?? "");

  function applyFilters() {
    const params = new URLSearchParams();
    if (estadoVal) params.set("estado", estadoVal);
    if (nivelVal) params.set("nivel", nivelVal);
    if (desdeVal) params.set("desde", desdeVal);
    if (hastaVal) params.set("hasta", hastaVal);
    const qs = params.toString();
    router.push(qs ? `/admin/leads?${qs}` : "/admin/leads");
  }

  function clearFilters() {
    setEstadoVal("");
    setNivelVal("");
    setDesdeVal("");
    setHastaVal("");
    router.push("/admin/leads");
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (estadoVal) params.set("estado", estadoVal);
    if (nivelVal) params.set("nivel", nivelVal);
    if (desdeVal) params.set("desde", desdeVal);
    if (hastaVal) params.set("hasta", hastaVal);
    const qs = params.toString();
    window.open(qs ? `/admin/leads/export?${qs}` : "/admin/leads/export", "_blank");
  }

  const selectClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const inputClass =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters();
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="filtro-estado"
          className="text-xs font-medium text-zinc-600"
        >
          Estado
        </label>
        <select
          id="filtro-estado"
          value={estadoVal}
          onChange={(e) => setEstadoVal(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_LABEL[e]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="filtro-nivel"
          className="text-xs font-medium text-zinc-600"
        >
          Nivel
        </label>
        <select
          id="filtro-nivel"
          value={nivelVal}
          onChange={(e) => setNivelVal(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos</option>
          {NIVELES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="filtro-desde"
          className="text-xs font-medium text-zinc-600"
        >
          Desde
        </label>
        <input
          id="filtro-desde"
          type="date"
          value={desdeVal}
          onChange={(e) => setDesdeVal(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="filtro-hasta"
          className="text-xs font-medium text-zinc-600"
        >
          Hasta
        </label>
        <input
          id="filtro-hasta"
          type="date"
          value={hastaVal}
          onChange={(e) => setHastaVal(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          Aplicar
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Exportar CSV
        </button>
      </div>
    </form>
  );
}
