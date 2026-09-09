"use client";

import { useActionState, useState } from "react";
import type { NivelesState } from "./actions";
import { guardarNiveles } from "./actions";
import { NIVELES, PAGINAS_CTA, CTA_HREF_DEFAULT } from "./niveles-constants";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/admin/components/tabs";
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
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
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

export interface NivelData {
  name?: string;
  ageRange?: string;
  subtitle?: string;
  subtitleVisible?: boolean;
  enabled?: boolean;
  headline?: string;
  description?: string;
  image?: string;
  program?: string[];
  methodology?: string;
  schedule?: { mondayFriday?: string; saturday?: string };
  cta?: string;
  ctaHref?: string;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
    {children}
  </h3>
);

function CheckboxRow({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-2 text-sm text-zinc-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-700 focus:ring-blue-600/20"
      />
      <span>
        {label}
        {hint ? <span className="block text-xs text-zinc-500">{hint}</span> : null}
      </span>
    </label>
  );
}

const SUBTABS = ["identificacion", "pedagogia", "academica"] as const;
type Subtab = (typeof SUBTABS)[number];

const SUBTAB_LABELS: Record<Subtab, string> = {
  identificacion: "Identificación",
  pedagogia: "Pedagogía",
  academica: "Académica",
};

// Vista previa de la tarjeta (replica la web), reutilizada en el panel sticky.
function CardPreview({
  preview,
  name,
  subtitle,
  subtitleVisible,
  ageRange,
}: {
  preview?: string;
  name: string;
  subtitle: string;
  subtitleVisible: boolean;
  ageRange: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={`Vista previa de la tarjeta de ${name}`}
          className="h-32 w-full object-cover"
        />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-zinc-100 text-sm text-zinc-400">
          Sin imagen
        </div>
      )}
      <div className="space-y-1 px-4 py-3 text-center">
        <p className="text-sm font-semibold text-zinc-900">{name || "Nombre del nivel"}</p>
        {subtitleVisible && subtitle ? (
          <p className="text-xs text-zinc-500">{subtitle}</p>
        ) : null}
        {ageRange ? (
          <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            {ageRange}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function NivelEditor({
  clave,
  data,
  fieldErrors,
}: {
  clave: string;
  data: NivelData;
  fieldErrors?: Record<string, string>;
}) {
  // Campos controlados para alimentar la mini-previsualización de la tarjeta.
  const [name, setName] = useState(data.name ?? "");
  const [ageRange, setAgeRange] = useState(data.ageRange ?? "");
  const [subtitle, setSubtitle] = useState(data.subtitle ?? "");
  const [subtitleVisible, setSubtitleVisible] = useState(
    data.subtitleVisible ?? false,
  );
  const [enabled, setEnabled] = useState(data.enabled ?? true);
  const [program, setProgram] = useState<string[]>(
    data.program && data.program.length > 0 ? data.program : [""],
  );
  const [preview, setPreview] = useState<string | undefined>(
    mediaUrl(data.image),
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updateProgram = (index: number, value: string) => {
    setProgram((prev) => prev.map((item, i) => (i === index ? value : item)));
  };
  const addProgram = () => setProgram((prev) => [...prev, ""]);
  const removeProgram = (index: number) =>
    setProgram((prev) => prev.filter((_, i) => i !== index));

  return (
    <Tabs defaultValue="identificacion" order={[...SUBTABS]}>
      <TabsList aria-label={`Secciones de ${clave}`}>
        {SUBTABS.map((sub) => (
          <TabsTrigger key={sub} value={sub}>
            {SUBTAB_LABELS[sub]}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Identificación y apariencia */}
      <TabsContent value="identificacion">
        <div className="gap-7 pt-5 lg:grid lg:grid-cols-[1fr_260px]">
          <div className="space-y-3">
            <SectionLabel>Datos de la tarjeta</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor={`${clave}_name`} className="block text-sm font-medium text-zinc-700">
                  Nombre <span className="text-red-600">*</span>
                </label>
                <input
                  id={`${clave}_name`}
                  name={`${clave}_name`}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Preescolar"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-500">Entre 2 y 40 caracteres.</p>
                <FieldError message={fieldErrors?.[`${clave}_name`]} />
              </div>
              <div>
                <label htmlFor={`${clave}_ageRange`} className="block text-sm font-medium text-zinc-700">
                  Edad
                </label>
                <input
                  id={`${clave}_ageRange`}
                  name={`${clave}_ageRange`}
                  type="text"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  placeholder="Ej. 3-5 años"
                  className={inputClass}
                />
                <FieldError message={fieldErrors?.[`${clave}_ageRange`]} />
              </div>
            </div>
            <div>
              <label htmlFor={`${clave}_subtitle`} className="block text-sm font-medium text-zinc-700">
                Subtítulo
              </label>
              <input
                id={`${clave}_subtitle`}
                name={`${clave}_subtitle`}
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej. Grados 1° a 5° · Enfoque STEAM"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-zinc-500">Micro-dato bajo el título de la tarjeta (opcional, hasta 120 caracteres).</p>
              <FieldError message={fieldErrors?.[`${clave}_subtitle`]} />
            </div>
            <div className="flex flex-wrap gap-6">
              <CheckboxRow
                id={`${clave}_subtitleVisible`}
                checked={subtitleVisible}
                onChange={setSubtitleVisible}
                label="Mostrar subtítulo en la tarjeta"
              />
              <CheckboxRow
                id={`${clave}_enabled`}
                checked={enabled}
                onChange={setEnabled}
                label="Nivel visible en la web"
                hint="Si se desmarca, el nivel deja de aparecer en tarjetas, footer y admisiones."
              />
            </div>
            <div>
              <span className="block text-sm font-medium text-zinc-700">Imagen de la tarjeta y del detalle</span>
              <input
                id={`${clave}_image`}
                name={`${clave}_image`}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFile}
                className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
              />
              <input type="hidden" name={`${clave}_image_path`} value={data.image ?? ""} />
              <p className="mt-1 text-xs text-zinc-500">
                {data.image ? "Imagen actual: ver previsualización." : "Sube una imagen (JPG, PNG, WebP o AVIF)."}
              </p>
              <FieldError message={fieldErrors?.[`${clave}_image`]} />
            </div>
          </div>

          {/* Vista previa sticky (solo visible en escritorio) */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Vista previa de la tarjeta
              </p>
              <CardPreview
                preview={preview}
                name={name}
                subtitle={subtitle}
                subtitleVisible={subtitleVisible}
                ageRange={ageRange}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* Contenido y propuesta pedagógica */}
      <TabsContent value="pedagogia">
        <div className="space-y-3 pt-5">
          <SectionLabel>Contenido y propuesta pedagógica</SectionLabel>
          <div>
            <label htmlFor={`${clave}_headline`} className="block text-sm font-medium text-zinc-700">
              Titular (headline) <span className="text-red-600">*</span>
            </label>
            <input
              id={`${clave}_headline`}
              name={`${clave}_headline`}
              type="text"
              defaultValue={data.headline ?? ""}
              placeholder="Ej. Primera experiencia escolar con alegría"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-500">Entre 3 y 200 caracteres.</p>
            <FieldError message={fieldErrors?.[`${clave}_headline`]} />
          </div>
          <div>
            <label htmlFor={`${clave}_description`} className="block text-sm font-medium text-zinc-700">
              Descripción <span className="text-red-600">*</span>
            </label>
            <textarea
              id={`${clave}_description`}
              name={`${clave}_description`}
              rows={3}
              defaultValue={data.description ?? ""}
              placeholder="Descripción larga de la página de detalle del nivel."
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-500">Entre 10 y 1000 caracteres.</p>
            <FieldError message={fieldErrors?.[`${clave}_description`]} />
          </div>
          <div>
            <label htmlFor={`${clave}_methodology`} className="block text-sm font-medium text-zinc-700">
              Metodología <span className="text-red-600">*</span>
            </label>
            <textarea
              id={`${clave}_methodology`}
              name={`${clave}_methodology`}
              rows={4}
              defaultValue={data.methodology ?? ""}
              placeholder="Cómo se enseña en este nivel educativo."
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-500">Entre 10 y 2000 caracteres.</p>
            <FieldError message={fieldErrors?.[`${clave}_methodology`]} />
          </div>
        </div>
      </TabsContent>

      {/* Estructura académica y accesos (CTA) */}
      <TabsContent value="academica">
        <div className="space-y-5 pt-5">
          <div>
            <span className="block text-sm font-medium text-zinc-700">Plan de estudios <span className="text-red-600">*</span></span>
            <div className="mt-1.5 space-y-1.5">
              {program.map((item, i) => (
                <div key={i} className="group flex items-center gap-1.5">
                  <input
                    name={`${clave}_program`}
                    type="text"
                    value={item}
                    onChange={(e) => updateProgram(i, e.target.value)}
                    placeholder={`Área ${i + 1} (ej. Lectoescritura, Matemáticas…)`}
                    className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeProgram(i)}
                    aria-label={`Quitar área ${i + 1}`}
                    className="shrink-0 rounded-lg p-2 text-zinc-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 group-hover:opacity-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addProgram}
              className="mt-2 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-500 transition hover:border-blue-400 hover:text-blue-700"
            >
              + Agregar área
            </button>
            <p className="mt-1 text-xs text-zinc-500">Lista de áreas de aprendizaje del programa.</p>
            <FieldError message={fieldErrors?.[`${clave}_program`]} />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Horarios */}
            <div className="space-y-3">
              <SectionLabel>Horarios</SectionLabel>
              <div>
                <label htmlFor={`${clave}_schedule_mondayFriday`} className="block text-sm font-medium text-zinc-700">
                  Lunes a viernes <span className="text-red-600">*</span>
                </label>
                <input
                  id={`${clave}_schedule_mondayFriday`}
                  name={`${clave}_schedule_mondayFriday`}
                  type="text"
                  defaultValue={data.schedule?.mondayFriday ?? ""}
                  placeholder="Ej. 7:30 a.m. – 12:30 p.m."
                  className={inputClass}
                />
                <FieldError message={fieldErrors?.[`${clave}_schedule_mondayFriday`]} />
              </div>
              <div>
                <label htmlFor={`${clave}_schedule_saturday`} className="block text-sm font-medium text-zinc-700">
                  Sábados <span className="text-red-600">*</span>
                </label>
                <input
                  id={`${clave}_schedule_saturday`}
                  name={`${clave}_schedule_saturday`}
                  type="text"
                  defaultValue={data.schedule?.saturday ?? ""}
                  placeholder="Ej. Actividades extracurriculares opcionales"
                  className={inputClass}
                />
                <FieldError message={fieldErrors?.[`${clave}_schedule_saturday`]} />
              </div>
            </div>

            {/* Botón CTA */}
            <div className="space-y-3">
              <SectionLabel>Botón de llamada a la acción</SectionLabel>
              <div>
                <label htmlFor={`${clave}_cta`} className="block text-sm font-medium text-zinc-700">
                  Texto del botón <span className="text-red-600">*</span>
                </label>
                <input
                  id={`${clave}_cta`}
                  name={`${clave}_cta`}
                  type="text"
                  defaultValue={data.cta ?? ""}
                  placeholder="Ej. Conoce el proceso de admisión"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-zinc-500">Texto del botón principal del hero. Entre 3 y 160 caracteres.</p>
                <FieldError message={fieldErrors?.[`${clave}_cta`]} />
              </div>
              <div>
                <label htmlFor={`${clave}_ctaHref`} className="block text-sm font-medium text-zinc-700">
                  Página de destino <span className="text-red-600">*</span>
                </label>
                <select
                  id={`${clave}_ctaHref`}
                  name={`${clave}_ctaHref`}
                  defaultValue={data.ctaHref ?? CTA_HREF_DEFAULT}
                  className={inputClass}
                >
                  {PAGINAS_CTA.map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-zinc-500">A qué página dirige el botón. Por defecto, admisiones.</p>
                <FieldError message={fieldErrors?.[`${clave}_ctaHref`]} />
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export function NivelesForm({ initial }: { initial: Record<string, NivelData> }) {
  const [state, formAction, pending] = useActionState<NivelesState, FormData>(
    guardarNiveles,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <Tabs defaultValue={NIVELES[0].clave} order={NIVELES.map((n) => n.clave)}>
          <TabsList aria-label="Niveles educativos">
            {NIVELES.map((nivel) => (
              <TabsTrigger key={nivel.clave} value={nivel.clave}>
                {nivel.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {NIVELES.map((nivel) => (
            <TabsContent key={nivel.clave} value={nivel.clave}>
              <div className="px-6 py-5">
                <NivelEditor
                  clave={nivel.clave}
                  data={initial[nivel.clave] ?? {}}
                  fieldErrors={state.fieldErrors}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {state.ok ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Niveles guardados. Aparecerán en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar niveles" />
    </form>
  );
}