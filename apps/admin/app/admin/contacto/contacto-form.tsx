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

export interface Departamento {
  name?: string;
  phone?: string;
  email?: string;
  hours?: string;
}

export interface ContactoData {
  info?: {
    address?: string;
    phone?: string;
    email?: string;
    hours?: string;
    mapUrl?: string;
    mapEmbedUrl?: string;
  };
  departments?: Departamento[];
}

export function ContactoForm({ initial }: { initial: ContactoData }) {
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
    setDepartments((prev) => [...prev, { name: "", phone: "", email: "", hours: "" }]);
  const removeDept = (i: number) =>
    setDepartments((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <form action={formAction} className="space-y-6">
      <fieldset className="space-y-3 rounded-lg border border-zinc-200 p-4">
        <legend className="text-sm font-semibold text-zinc-900">
          Datos de contacto
        </legend>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-zinc-700">
              Dirección
            </label>
            <input
              id="address"
              name="address"
              type="text"
              defaultValue={info.address ?? ""}
              placeholder="Ej. Calle 123 # 45-67"
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.address} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              defaultValue={info.phone ?? ""}
              placeholder="Ej. +57 601 234 5678"
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.phone} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={info.email ?? ""}
              placeholder="Ej. contacto@colegio.edu.co"
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.email} />
          </div>
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-zinc-700">
              Horario
            </label>
            <input
              id="hours"
              name="hours"
              type="text"
              defaultValue={info.hours ?? ""}
              placeholder="Ej. Lunes a viernes, 7:00 a.m. – 4:00 p.m."
              className={inputClass}
            />
            <FieldError message={state.fieldErrors?.hours} />
          </div>
        </div>

        <div>
          <label htmlFor="mapUrl" className="block text-sm font-medium text-zinc-700">
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
          <label htmlFor="mapEmbedUrl" className="block text-sm font-medium text-zinc-700">
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
            <div key={i} className="space-y-3 rounded-lg border border-zinc-100 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`dept_name-${i}`} className="block text-sm font-medium text-zinc-700">
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
                  <label htmlFor={`dept_phone-${i}`} className="block text-sm font-medium text-zinc-700">
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
                  <FieldError message={state.fieldErrors?.[`dept_phone-${i}`]} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor={`dept_email-${i}`} className="block text-sm font-medium text-zinc-700">
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
                  <FieldError message={state.fieldErrors?.[`dept_email-${i}`]} />
                </div>
                <div>
                  <label htmlFor={`dept_hours-${i}`} className="block text-sm font-medium text-zinc-700">
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
                  <FieldError message={state.fieldErrors?.[`dept_hours-${i}`]} />
                </div>
              </div>
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
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          Contacto guardado. Aparecerá en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar contacto" />
    </form>
  );
}
