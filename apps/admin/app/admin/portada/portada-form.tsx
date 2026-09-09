"use client";

import { useActionState, useState } from "react";
import type { PortadaState } from "./actions";
import {
  guardarHero,
  guardarMetricas,
  guardarNavbar,
  guardarPilares,
} from "./actions";
import { mediaUrl } from "@/lib/storage";

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

function Status({ ok }: { ok?: boolean }) {
  if (!ok) return null;
  return (
    <p
      role="status"
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
    >
      Guardado. Aparecerá en la web tras el rebuild automático.
    </p>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando…" : label}
    </button>
  );
}

interface HeroData {
  heroPhoto?: string;
  name?: string;
  slogan?: string;
  description?: string;
}

export function HeroForm({
  initial,
  heroJson,
}: {
  initial: HeroData;
  heroJson: string;
}) {
  const [state, formAction, pending] = useActionState<PortadaState, FormData>(
    guardarHero,
    {},
  );
  const [preview, setPreview] = useState<string | undefined>(
    mediaUrl(initial.heroPhoto),
  );

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="hero_json" value={heroJson} />

      <div>
        <label
          htmlFor="titulo"
          className="block text-sm font-medium text-zinc-700"
        >
          Título del hero <span className="text-red-600">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          defaultValue={initial.name ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">Entre 2 y 80 caracteres.</p>
        <FieldError message={state.fieldErrors?.titulo} />
      </div>

      <div>
        <label
          htmlFor="subtitulo"
          className="block text-sm font-medium text-zinc-700"
        >
          Subtítulo <span className="text-red-600">*</span>
        </label>
        <textarea
          id="subtitulo"
          name="subtitulo"
          rows={2}
          defaultValue={initial.slogan ?? initial.description ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">Entre 2 y 200 caracteres.</p>
        <FieldError message={state.fieldErrors?.subtitulo} />
      </div>

      <div>
        <span className="block text-sm font-medium text-zinc-700">
          Imagen del hero
        </span>
        <input
          id="heroPhoto"
          name="heroPhoto"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handlePhoto}
          className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Se sirve optimizada (AVIF/WebP) en la web. Sube una imagen de al menos
          1200×900.
        </p>
      </div>

      {preview ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa del hero"
            className="h-44 w-full rounded-lg object-cover ring-1 ring-zinc-200"
          />
        </div>
      ) : null}

      <Status ok={state.ok} />
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar hero" />
    </form>
  );
}

// ── Navbar ──────────────────────────────────────────────────────────────────
// Lista fija de enlaces. Vista previa en vivo del menú mientras se edita.
// Las URLs son un <select> cerrado: solo rutas internas que existen en el
// código (apps/web/src/pages/*), para evitar enlaces rotos.

const NAVBAR_HINTS = [
  "Inicio",
  "Nosotros",
  "Niveles",
  "Admisiones",
  "Noticias",
  "Circulares",
  "Contacto",
];

const NAVBAR_ROUTES = [
  "/",
  "/nosotros",
  "/niveles",
  "/admisiones",
  "/noticias",
  "/circulares",
  "/contacto",
];

interface NavbarLinkData {
  label?: string;
  href?: string;
}

export function NavbarForm({ initial }: { initial: NavbarLinkData[] }) {
  const [state, formAction, pending] = useActionState<PortadaState, FormData>(
    guardarNavbar,
    {},
  );
  const links = initial.length > 0 ? initial : [];

  const [labels, setLabels] = useState<string[]>(
    NAVBAR_HINTS.map((_, i) => initial[i]?.label ?? ""),
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="preview"
          className="block text-sm font-medium text-zinc-700"
        >
          Vista previa del menú
        </label>
        <div
          id="preview"
          className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
        >
          {labels.filter((l) => l.trim()).length > 0 ? (
            labels
              .map((label, i) => ({ label, href: links[i]?.href ?? "#" }))
              .filter(({ label }) => label.trim())
              .map(({ label, href }) => (
                <span
                  key={`${label}-${href}`}
                  className="text-sm font-medium text-blue-800"
                >
                  {label}
                </span>
              ))
          ) : (
            <span className="text-sm text-zinc-400">
              Aún no hay enlaces con texto.
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {NAVBAR_HINTS.map((hint, i) => {
          const currentLabel = links[i]?.label ?? "";
          const summary = currentLabel.trim() || hint;
          return (
            <details
              key={i}
              className="group rounded-lg border border-zinc-200 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50">
                <span>
                  {i + 1}. {summary}
                </span>
                <span className="text-xs text-zinc-400">Enlace</span>
              </summary>
              <div className="space-y-3 border-t border-zinc-100 px-4 py-4">
                <div>
                  <label
                    htmlFor={`label-${i}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Texto <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={`label-${i}`}
                    name={`label_${i}`}
                    type="text"
                    defaultValue={currentLabel}
                    placeholder={hint}
                    onChange={(e) =>
                      setLabels((prev) => {
                        const next = [...prev];
                        next[i] = e.target.value;
                        return next;
                      })
                    }
                    className={inputClass}
                  />
                  <FieldError message={state.fieldErrors?.[`label_${i}`]} />
                </div>
                <div>
                  <label
                    htmlFor={`href-${i}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Página de destino <span className="text-red-600">*</span>
                  </label>
                  <select
                    id={`href-${i}`}
                    name={`href_${i}`}
                    defaultValue={links[i]?.href ?? ""}
                    className={inputClass}
                  >
                    <option value="">— Elegir página —</option>
                    {NAVBAR_ROUTES.map((route) => (
                      <option key={route} value={route}>
                        {route}
                      </option>
                    ))}
                  </select>
                  <FieldError message={state.fieldErrors?.[`href_${i}`]} />
                </div>
              </div>
            </details>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Deja un enlace sin texto para omitirlo. Puedes reordenar las páginas del
        colegio, pero solo puedes enlazar páginas ya existentes.
      </p>

      {state.fieldErrors?._form ? (
        <FormError message={state.fieldErrors._form} />
      ) : null}
      <Status ok={state.ok} />
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar menú" />
    </form>
  );
}

// ── Métricas ────────────────────────────────────────────────────────────────
// 4 métricas fijas de la franja de datos de la portada.

const METRICAS_PLACEHOLDERS = [
  { value: "40+", label: "Años de trayectoria" },
  { value: "1.200", label: "Estudiantes activos" },
  { value: "1:18", label: "Ratio profesor-estudiante" },
  { value: "98%", label: "Aprobación en pruebas estatales" },
];

interface MetricaData {
  value?: string;
  label?: string;
}

export function MetricasForm({ initial }: { initial: MetricaData[] }) {
  const [state, formAction, pending] = useActionState<PortadaState, FormData>(
    guardarMetricas,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-3">
        {METRICAS_PLACEHOLDERS.map((ph, i) => {
          const currentValue = initial[i]?.value ?? "";
          const currentLabel = initial[i]?.label ?? "";
          const summary =
            currentValue.trim() && currentLabel.trim()
              ? `${currentValue} — ${currentLabel}`
              : `Métrica ${i + 1} · sin completar`;
          return (
            <details
              key={i}
              className="group rounded-lg border border-zinc-200 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50">
                <span>
                  {i + 1}. {summary}
                </span>
                <span className="text-xs text-zinc-400">Métrica</span>
              </summary>
              <div className="space-y-3 border-t border-zinc-100 px-4 py-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_1fr]">
                  <div>
                    <label
                      htmlFor={`value-${i}`}
                      className="block text-sm font-medium text-zinc-700"
                    >
                      Valor <span className="text-red-600">*</span>
                    </label>
                    <input
                      id={`value-${i}`}
                      name={`value_${i}`}
                      type="text"
                      defaultValue={currentValue}
                      placeholder={ph.value}
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.[`value_${i}`]} />
                  </div>
                  <div>
                    <label
                      htmlFor={`metrica-label-${i}`}
                      className="block text-sm font-medium text-zinc-700"
                    >
                      Etiqueta <span className="text-red-600">*</span>
                    </label>
                    <input
                      id={`metrica-label-${i}`}
                      name={`label_${i}`}
                      type="text"
                      defaultValue={currentLabel}
                      placeholder={ph.label}
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.[`label_${i}`]} />
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>

      <p className="text-xs text-zinc-500">
        Deja una métrica vacía para omitirla. La franja muestra hasta 4 datos.
      </p>

      {state.fieldErrors?._form ? (
        <FormError message={state.fieldErrors._form} />
      ) : null}
      <Status ok={state.ok} />
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar métricas" />
    </form>
  );
}

// ── Pilares ─────────────────────────────────────────────────────────────────
// Título de la sección + 4 pilares fijos {title, description, metric}.

interface PilarData {
  title?: string;
  description?: string;
  metric?: string;
}

const PILARES_COUNT = 4;

export function PilaresForm({
  initial,
  initialTitulo,
}: {
  initial: PilarData[];
  initialTitulo: string;
}) {
  const [state, formAction, pending] = useActionState<PortadaState, FormData>(
    guardarPilares,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="pilares-titulo"
          className="block text-sm font-medium text-zinc-700"
        >
          Título de la sección <span className="text-red-600">*</span>
        </label>
        <input
          id="pilares-titulo"
          name="titulo"
          type="text"
          defaultValue={initialTitulo}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">Entre 1 y 120 caracteres.</p>
        <FieldError message={state.fieldErrors?.titulo} />
      </div>

      <div className="space-y-3">
        {Array.from({ length: PILARES_COUNT }).map((_, i) => {
          const pilar = initial[i] ?? {};
          const summary = pilar.title?.trim()
            ? pilar.title
            : `Pilar ${i + 1} · sin completar`;
          return (
            <details
              key={i}
              className="group rounded-lg border border-zinc-200 bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50">
                <span>
                  {i + 1}. {summary}
                </span>
                <span className="text-xs text-zinc-400">Pilar</span>
              </summary>
              <div className="space-y-3 border-t border-zinc-100 px-4 py-4">
                <div>
                  <label
                    htmlFor={`pilar-title-${i}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Título del pilar <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={`pilar-title-${i}`}
                    name={`title_${i}`}
                    type="text"
                    defaultValue={pilar.title ?? ""}
                    className={inputClass}
                  />
                  <FieldError message={state.fieldErrors?.[`title_${i}`]} />
                </div>
                <div>
                  <label
                    htmlFor={`pilar-description-${i}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Descripción <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id={`pilar-description-${i}`}
                    name={`description_${i}`}
                    rows={3}
                    defaultValue={pilar.description ?? ""}
                    className={inputClass}
                  />
                  <FieldError
                    message={state.fieldErrors?.[`description_${i}`]}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`pilar-metric-${i}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Métrica destacada <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={`pilar-metric-${i}`}
                    name={`metric_${i}`}
                    type="text"
                    defaultValue={pilar.metric ?? ""}
                    placeholder="15+ Disciplinas extracurriculares"
                    className={inputClass}
                  />
                  <FieldError message={state.fieldErrors?.[`metric_${i}`]} />
                </div>
              </div>
            </details>
          );
        })}
      </div>

      {state.fieldErrors?._form ? (
        <FormError message={state.fieldErrors._form} />
      ) : null}
      <Status ok={state.ok} />
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar pilares" />
    </form>
  );
}
