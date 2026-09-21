"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const STEP_LABELS: Record<string, string> = {
  colegio: "Registro del colegio en BD",
  admin_user: "Invitación al director",
  seed_contenido: "Contenido inicial",
  vercel_project: "Proyecto Vercel",
  vercel_env: "Variables de entorno",
  vercel_domain: "Dominio",
  vercel_hook: "Deploy hook",
  tenant_settings: "Settings del tenant",
};

interface JobStatus {
  status: "pending" | "running" | "failed" | "done";
  currentStep: string | null;
  steps: { name: string; status: string; detail?: unknown }[];
  error: string | null;
  errorCode: string | null;
  updatedAt: string;
  domain: string;
}

const STALE_MS = 90_000;

// Polling del job de provisión (F4). Lee el estado cada 3s y, si el job está
// `pending` o `running`-stale (worker cortado por timeout), dispara `run` para
// reanudar idempotentemente. En `failed` muestra el error y el botón Reintentar.
export default function JobPolling({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [retrying, setRetrying] = useState(false);
  const inFlight = useRef(false);

  const tick = useCallback(async () => {
    const res = await fetch(`/operador/colegios/${jobId}/status`);
    if (!res.ok) return;
    const data = (await res.json()) as JobStatus & { ok?: boolean };
    if (!data.ok) return;
    setJob(data);

    if (data.status === "done" || data.status === "failed") return;

    const updatedAt = new Date(data.updatedAt).getTime();
    const stale = Date.now() - updatedAt > STALE_MS;
    const shouldRun =
      data.status === "pending" || (data.status === "running" && stale);

    if (shouldRun && !inFlight.current) {
      inFlight.current = true;
      try {
        await fetch(`/operador/colegios/${jobId}/run`, { method: "POST" });
      } catch {
        // se reintenta en el siguiente tick
      } finally {
        inFlight.current = false;
      }
    }
  }, [jobId]);

  useEffect(() => {
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 3000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [tick]);

  async function handleRetry() {
    setRetrying(true);
    try {
      await fetch(`/operador/colegios/${jobId}/run`, { method: "POST" });
      await tick();
    } finally {
      setRetrying(false);
    }
  }

  const steps = job?.steps ?? [];
  const status = job?.status ?? "pending";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <StatusBanner status={status} />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Progreso</h2>
        <ol className="mt-3 space-y-2">
          {steps.map((s) => (
            <li key={s.name} className="flex items-center gap-3 text-sm">
              <StepIcon status={s.status} />
              <span className="text-zinc-700">{STEP_LABELS[s.name] ?? s.name}</span>
            </li>
          ))}
          {steps.length === 0 && (
            <li className="text-sm text-zinc-500">Iniciando…</li>
          )}
        </ol>
      </div>

      {status === "failed" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-800">La provisión falló</p>
          <p className="mt-1 text-sm text-red-700">
            {job?.error ?? "Error desconocido."}
          </p>
          {job?.errorCode === "RECOVERABLE" && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
            >
              {retrying ? "Reintentando…" : "Reintentar"}
            </button>
          )}
        </div>
      )}

      {status === "done" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-800">Alta completada</p>
          {job?.domain && (
            <div className="mt-3 space-y-2 text-sm text-emerald-800">
              <p>
                Configura el DNS de <span className="font-mono">{job.domain}</span>{" "}
                apuntando a Vercel:
              </p>
              <ul className="list-inside list-disc space-y-1">
                <li>
                  Añade un registro <span className="font-mono">CNAME</span> a{" "}
                  <span className="font-mono">cname.vercel-dns.com</span> (o{" "}
                  <span className="font-mono">A</span> a{" "}
                  <span className="font-mono">76.76.21.21</span>).
                </li>
                <li>Verifica el dominio en Vercel y espera la propagación.</li>
              </ul>
            </div>
          )}
          <Link
            href="/operador/colegios"
            className="mt-4 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            Volver al listado
          </Link>
        </div>
      )}
    </div>
  );
}

function StatusBanner({ status }: { status: JobStatus["status"] }) {
  const map: Record<JobStatus["status"], { label: string; cls: string }> = {
    pending: { label: "Pendiente", cls: "bg-zinc-100 text-zinc-700" },
    running: { label: "En curso…", cls: "bg-blue-100 text-blue-700" },
    done: { label: "Completado", cls: "bg-emerald-100 text-emerald-700" },
    failed: { label: "Falló", cls: "bg-red-100 text-red-700" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-block rounded-md px-2.5 py-1 text-sm font-medium ${cls}`}>
      {label}
    </span>
  );
}

function StepIcon({ status }: { status: string }) {
  if (status === "done") return <span className="text-emerald-600">✓</span>;
  if (status === "running") return <span className="text-blue-600">●</span>;
  if (status === "failed") return <span className="text-red-600">✕</span>;
  return <span className="text-zinc-300">○</span>;
}
