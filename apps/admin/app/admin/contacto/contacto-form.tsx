"use client";

import { useActionState, useState } from "react";
import type { ContactoState } from "./actions";
import { guardarContacto } from "./actions";

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

export interface Departamento {
  name?: string;
  phone?: string;
  email?: string;
  hours?: string;
  hidden?: boolean;
}

export interface ContactoData {
  info?: {
    mapUrl?: string;
    mapEmbedUrl?: string;
  };
  departments?: Departamento[];
  whatsapp?: string;
}

export function ContactoForm({
  initial,
  whatsappInicial,
}: {
  initial: ContactoData;
  whatsappInicial?: string;
}) {
  const [state, formAction, pending] = useActionState<ContactoState, FormData>(
    guardarContacto,
    {},
  );

  const info = initial.info ?? {};
  const [departments, setDepartments] = useState<Departamento[]>(
    initial.departments && initial.departments.length > 0
      ? initial.departments
      : [{ name: "", phone: "", email: "", hours: "" }],
  );

  const addDept = () =>
    setDepartments((prev) => [
      ...prev,
      { name: "", phone: "", email: "", hours: "", hidden: false },
    ]);
  const removeDept = (i: number) =>
    setDepartments((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <form action={formAction} className="space-y-6">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
        Dirección, ciudad, teléfono, email y horario se editan en la sección
        &quot;Footer&quot; (derechos de contacto del pie de página).
      </p>

      <fieldset className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <legend className="text-sm font-semibold text-zinc-900">
          WhatsApp y mapa
        </legend>

        <div>
          <label
            htmlFor="whatsapp"
            className="block text-sm font-medium text-zinc-700"
          >
            WhatsApp <span className="text-red-600">*</span>
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="text"
            defaultValue={whatsappInicial ?? ""}
            placeholder="Ej. +573101234567"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-zinc-500">
            Número internacional sin espacios ni guiones (E.164). Es el número
            al que se redirige el botón de WhatsApp en la web.
          </p>
          <FieldError message={state.fieldErrors?.whatsapp} />
        </div>

        <div>
          <label
            htmlFor="mapUrl"
            className="block text-sm font-medium text-zinc-700"
          >
            URL del mapa (Cómo llegar)
          </label>
          <input
            id="mapUrl"
            name="mapUrl"
            type="url"
            defaultValue={info.mapUrl ?? ""}
            placeholder="https://maps.google.com/?q=…"
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.mapUrl} />
        </div>

        <div>
          <label
            htmlFor="mapEmbedUrl"
            className="block text-sm font-medium text-zinc-700"
          >
            URL de embed del mapa
          </label>
          <input
            id="mapEmbedUrl"
            name="mapEmbedUrl"
            type="url"
            defaultValue={info.mapEmbedUrl ?? ""}
            placeholder="https://www.google.com/maps/embed?pb=…"
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.mapEmbedUrl} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <legend className="text-sm font-semibold text-zinc-900">
          Directorio por departamento
        </legend>
        <div className="space-y-4">
          {departments.map((dept, i) => (
            <div
              key={i}
              className="space-y-3 rounded-lg border border-zinc-100 p-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`dept_name-${i}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Nombre
                  </label>
                  <input
                    id={`dept_name-${i}`}
                    name="dept_name"
                    type="text"
                    defaultValue={dept.name ?? ""}
                    placeholder="Ej. Recepción general"
                    className={inputClass}
                  />
                  <FieldError message={state.fieldErrors?.[`dept_name-${i}`]} />
                </div>
                <div>
                  <label
                    htmlFor={`dept_phone-${i}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Teléfono
                  </label>
                  <input
                    id={`dept_phone-${i}`}
                    name="dept_phone"
                    type="text"
                    defaultValue={dept.phone ?? ""}
                    placeholder="Ej. +57 601 234 5678"
                    className={inputClass}
                  />
                  <FieldError
                    message={state.fieldErrors?.[`dept_phone-${i}`]}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`dept_email-${i}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Email
                  </label>
                  <input
                    id={`dept_email-${i}`}
                    name="dept_email"
                    type="email"
                    defaultValue={dept.email ?? ""}
                    placeholder="Ej. recepcion@colegio.edu.co"
                    className={inputClass}
                  />
                  <FieldError
                    message={state.fieldErrors?.[`dept_email-${i}`]}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`dept_hours-${i}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Horario
                  </label>
                  <input
                    id={`dept_hours-${i}`}
                    name="dept_hours"
                    type="text"
                    defaultValue={dept.hours ?? ""}
                    placeholder="Ej. Lunes a viernes, 7:00 a.m. – 4:00 p.m."
                    className={inputClass}
                  />
                  <FieldError
                    message={state.fieldErrors?.[`dept_hours-${i}`]}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name={`dept_hidden-${i}`}
                  defaultChecked={dept.hidden ?? false}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600/40"
                />
                Ocultar del directorio
              </label>
              <button
                type="button"
                onClick={() => removeDept(i)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                Eliminar departamento
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addDept}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          + Agregar departamento
        </button>
      </fieldset>

      {state.ok ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
        >
          Contacto guardado. Aparecerá en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar contacto" />
    </form>
  );
}
