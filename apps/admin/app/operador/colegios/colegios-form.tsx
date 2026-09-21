"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

// Formulario de alta de un colegio. Hace POST a /operador/colegios/crear y,
// en éxito, redirige al detalle del job (polling). El checkbox de "fase código"
// es el gate humano F3: deshabilita el botón hasta confirmar que el código
// (config + branding + clients.json) ya está mergeado y desplegado.
export default function ColegiosForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors([]);
    setWarnings([]);

    const form = new FormData(event.currentTarget);
    const payload = {
      slug: String(form.get("slug") ?? ""),
      domain: String(form.get("domain") ?? ""),
      adminEmail: String(form.get("adminEmail") ?? ""),
      nombre: String(form.get("nombre") ?? ""),
    };

    try {
      const res = await fetch("/operador/colegios/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok && data.jobId) {
        router.push(`/operador/colegios/${data.jobId}`);
        return;
      }

      setErrors(data.errors ?? ["Error inesperado."]);
      setWarnings(data.warnings ?? []);
    } catch {
      setErrors(["No se pudo conectar con el servidor."]);
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-zinc-700">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="colegio-norte"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-zinc-700">
            Dominio
          </label>
          <input
            id="domain"
            name="domain"
            type="text"
            required
            placeholder="micolegio.edu.co"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="adminEmail" className="block text-sm font-medium text-zinc-700">
            Email del director
          </label>
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            required
            placeholder="director@micolegio.edu.co"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-zinc-700">
            Nombre (opcional)
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            placeholder="Se deriva del slug"
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-700 focus:ring-blue-600/30"
        />
        <span>
          Confirmo que la fase código ya está mergeada y desplegada:
          <span className="font-mono text-xs"> apps/web/src/configs/&lt;slug&gt;.ts</span>,
          <span className="font-mono text-xs"> public/branding/&lt;slug&gt;/</span> y la
          entrada en <span className="font-mono text-xs">clients.json</span>.
        </span>
      </label>

      {warnings.length > 0 && (
        <ul className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}

      {errors.length > 0 && (
        <ul className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      <button
        type="submit"
        disabled={pending || !confirmed}
        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Iniciando…" : "Iniciar alta"}
      </button>
    </form>
  );
}
