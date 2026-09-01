"use client";

import { useActionState, useState } from "react";
import type { AdmisionesState } from "./actions";
import { guardarAdmisiones } from "./actions";

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

export interface CronogramaItem {
  title?: string;
  date?: string;
  description?: string;
}

export interface FaqItem {
  title?: string;
  content?: string;
}

export interface AdmisionesData {
  periodLabel?: string;
  requirements?: string[];
  schedule?: CronogramaItem[];
  faq?: FaqItem[];
}

export function AdmisionesForm({ initial }: { initial: AdmisionesData }) {
  const [state, formAction, pending] = useActionState<AdmisionesState, FormData>(
    guardarAdmisiones,
    {},
  );

  const [requisitos, setRequisitos] = useState<string[]>(
    initial.requirements && initial.requirements.length > 0
      ? initial.requirements
      : [""],
  );
  const [cronograma, setCronograma] = useState<CronogramaItem[]>(
    initial.schedule && initial.schedule.length > 0
      ? initial.schedule
      : [{ title: "", date: "", description: "" }],
  );
  const [faq, setFaq] = useState<FaqItem[]>(
    initial.faq && initial.faq.length > 0
      ? initial.faq
      : [{ title: "", content: "" }],
  );

  const addRequisito = () => setRequisitos((prev) => [...prev, ""]);
  const removeRequisito = (i: number) =>
    setRequisitos((prev) => prev.filter((_, idx) => idx !== i));

  const addCronograma = () =>
    setCronograma((prev) => [...prev, { title: "", date: "", description: "" }]);
  const removeCronograma = (i: number) =>
    setCronograma((prev) => prev.filter((_, idx) => idx !== i));

  const addFaq = () => setFaq((prev) => [...prev, { title: "", content: "" }]);
  const removeFaq = (i: number) =>
    setFaq((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="periodLabel" className="block text-sm font-medium text-zinc-700">
          Periodo
        </label>
        <input
          id="periodLabel"
          name="periodLabel"
          type="text"
          defaultValue={initial.periodLabel ?? ""}
          placeholder="Ej. Admisiones 2026 abiertas"
          className={inputClass}
        />
        <FieldError message={state.fieldErrors?.periodLabel} />
      </div>

      {/* Requisitos */}
      <fieldset className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <legend className="text-sm font-semibold text-zinc-900">Requisitos</legend>
        <div className="space-y-3">
          {requisitos.map((req, i) => (
            <div key={i} className="flex items-start gap-2">
              <input
                name="requisito"
                type="text"
                defaultValue={req}
                placeholder="Ej. Formulario de inscripción"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeRequisito(i)}
                className="mt-1.5 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <FieldError message={state.fieldErrors?._form} />
        <button
          type="button"
          onClick={addRequisito}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          + Agregar requisito
        </button>
      </fieldset>

      {/* Cronograma */}
      <fieldset className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <legend className="text-sm font-semibold text-zinc-900">Cronograma</legend>
        <div className="space-y-4">
          {cronograma.map((item, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-zinc-100 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`crono_title-${i}`} className="block text-sm font-medium text-zinc-700">
                    Título
                  </label>
                  <input
                    id={`crono_title-${i}`}
                    name="crono_title"
                    type="text"
                    defaultValue={item.title ?? ""}
                    placeholder="Ej. Inscripciones abiertas"
                    className={inputClass}
                  />
                  <FieldError message={state.fieldErrors?.[`crono_title-${i}`]} />
                </div>
                <div>
                  <label htmlFor={`crono_date-${i}`} className="block text-sm font-medium text-zinc-700">
                    Fecha
                  </label>
                  <input
                    id={`crono_date-${i}`}
                    name="crono_date"
                    type="text"
                    defaultValue={item.date ?? ""}
                    placeholder="Ej. Enero – marzo"
                    className={inputClass}
                  />
                  <FieldError message={state.fieldErrors?.[`crono_date-${i}`]} />
                </div>
              </div>
              <div>
                <label htmlFor={`crono_description-${i}`} className="block text-sm font-medium text-zinc-700">
                  Descripción
                </label>
                <textarea
                  id={`crono_description-${i}`}
                  name="crono_description"
                  rows={2}
                  defaultValue={item.description ?? ""}
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`crono_description-${i}`]} />
              </div>
              <button
                type="button"
                onClick={() => removeCronograma(i)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                Eliminar etapa
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addCronograma}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          + Agregar etapa
        </button>
      </fieldset>

      {/* FAQ */}
      <fieldset className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <legend className="text-sm font-semibold text-zinc-900">Preguntas frecuentes</legend>
        <div className="space-y-4">
          {faq.map((item, i) => (
            <div key={i} className="space-y-3 rounded-lg border border-zinc-100 p-3">
              <div>
                <label htmlFor={`faq_title-${i}`} className="block text-sm font-medium text-zinc-700">
                  Pregunta
                </label>
                <input
                  id={`faq_title-${i}`}
                  name="faq_title"
                  type="text"
                  defaultValue={item.title ?? ""}
                  placeholder="Ej. ¿Qué edades corresponden a cada nivel?"
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`faq_title-${i}`]} />
              </div>
              <div>
                <label htmlFor={`faq_content-${i}`} className="block text-sm font-medium text-zinc-700">
                  Respuesta
                </label>
                <textarea
                  id={`faq_content-${i}`}
                  name="faq_content"
                  rows={3}
                  defaultValue={item.content ?? ""}
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.[`faq_content-${i}`]} />
              </div>
              <button
                type="button"
                onClick={() => removeFaq(i)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                Eliminar pregunta
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addFaq}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          + Agregar pregunta
        </button>
      </fieldset>

      {state.ok ? (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Admisiones guardadas. Aparecerán en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar admisiones" />
    </form>
  );
}
