"use client";

import { useActionState, useState } from "react";
import type { FooterState } from "./actions";
import { guardarFooter } from "./actions";
import {
  PAGINAS_FOOTER,
  REDES_SOCIALES,
} from "./footer-constants";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/app/admin/components/tabs";

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

export interface FooterNivelData {
  name?: string;
  href?: string;
}

export interface FooterData {
  contact?: {
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    officeHours?: string;
  };
  contactTitle?: string;
  levelsTitle?: string;
  socialTitle?: string;
  social?: Record<string, string>;
  levels?: FooterNivelData[];
}

const TAB_ORDER = ["contacto", "redes", "niveles"];

// Valores por defecto que se muestran cuando aún no se ha guardado la clave
// `footer` (primera vez). El director los puede editar libremente.
const FOOTER_FALLBACK: FooterData = {
  contact: {
    address: "Calle 123 # 45-67",
    city: "Bogotá, Colombia",
    phone: "+57 601 234 5678",
    email: "contacto@colegio.edu.co",
    officeHours: "Lunes a viernes, 7:00 a.m. – 4:00 p.m.",
  },
  contactTitle: "Contacto",
  levelsTitle: "Niveles educativos",
  socialTitle: "Síguenos",
  social: {},
  levels: [
    { name: "Preescolar", href: "/niveles/preescolar" },
    { name: "Primaria", href: "/niveles/primaria" },
    { name: "Secundaria", href: "/niveles/secundaria" },
  ],
};

const NIVEL_VACIO: FooterNivelData = { name: "", href: "" };

export function FooterForm({ initial }: { initial: FooterData }) {
  const [state, formAction, pending] = useActionState<FooterState, FormData>(
    guardarFooter,
    {},
  );

  const contact = {
    ...(FOOTER_FALLBACK.contact ?? {}),
    ...(initial.contact ?? {}),
  };
  const social = initial.social ?? {};
  const fieldErrors = state.fieldErrors;

  const initialData = {
    contactTitle: initial.contactTitle ?? FOOTER_FALLBACK.contactTitle,
    levelsTitle: initial.levelsTitle ?? FOOTER_FALLBACK.levelsTitle,
    socialTitle: initial.socialTitle ?? FOOTER_FALLBACK.socialTitle,
  };

  // Estado local de la lista de niveles (elementos dinámicos).
  const [levels, setLevels] = useState<FooterNivelData[]>(() => {
    const initialLevels = initial.levels;
    if (initialLevels && initialLevels.length > 0) return initialLevels;
    return FOOTER_FALLBACK.levels ?? [];
  });

  const addNivel = () =>
    setLevels((prev) => [...prev, { ...NIVEL_VACIO }]);
  const removeNivel = (i: number) =>
    setLevels((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <Tabs defaultValue="contacto" order={TAB_ORDER}>
          <TabsList aria-label="Secciones del footer">
            <TabsTrigger value="contacto">Contacto</TabsTrigger>
            <TabsTrigger value="redes">Redes sociales</TabsTrigger>
            <TabsTrigger value="niveles">Niveles</TabsTrigger>
          </TabsList>

          {/* ── Contacto ─────────────────────────────────────────────── */}
          <TabsContent value="contacto">
            <div className="space-y-4 px-6 py-5">
              <div>
                <label
                  htmlFor="contactTitle"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Título de la columna "Contacto"
                </label>
                <input
                  id="contactTitle"
                  name="contactTitle"
                  type="text"
                  defaultValue={initialData.contactTitle ?? ""}
                  className={inputClass}
                />
                <FieldError message={fieldErrors?.contactTitle} />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Dirección
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    defaultValue={contact.address ?? ""}
                    placeholder="Ej. Calle 123 # 45-67"
                    className={inputClass}
                  />
                  <FieldError message={fieldErrors?.address} />
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Ciudad
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    defaultValue={contact.city ?? ""}
                    placeholder="Ej. Bogotá, Colombia"
                    className={inputClass}
                  />
                  <FieldError message={fieldErrors?.city} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    defaultValue={contact.phone ?? ""}
                    placeholder="Ej. +57 601 234 5678"
                    className={inputClass}
                  />
                  <FieldError message={fieldErrors?.phone} />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-700"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={contact.email ?? ""}
                    placeholder="Ej. contacto@colegio.edu.co"
                    className={inputClass}
                  />
                  <FieldError message={fieldErrors?.email} />
                </div>
              </div>

              <div>
                <label
                  htmlFor="officeHours"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Horario
                </label>
                <input
                  id="officeHours"
                  name="officeHours"
                  type="text"
                  defaultValue={contact.officeHours ?? ""}
                  placeholder="Ej. Lunes a viernes, 7:00 a.m. – 4:00 p.m."
                  className={inputClass}
                />
                <FieldError message={fieldErrors?.officeHours} />
              </div>
            </div>
          </TabsContent>

          {/* ── Redes sociales ───────────────────────────────────────── */}
          <TabsContent value="redes">
            <div className="space-y-4 px-6 py-5">
              <div>
                <label
                  htmlFor="socialTitle"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Título de la columna "Síguenos"
                </label>
                <input
                  id="socialTitle"
                  name="socialTitle"
                  type="text"
                  defaultValue={initialData.socialTitle ?? ""}
                  className={inputClass}
                />
                <FieldError message={fieldErrors?.socialTitle} />
              </div>

              {REDES_SOCIALES.map((red) => (
                <div key={red.clave}>
                  <label
                    htmlFor={`social_${red.clave}`}
                    className="block text-sm font-medium text-zinc-700"
                  >
                    {red.label}
                  </label>
                  <input
                    id={`social_${red.clave}`}
                    name={`social_${red.clave}`}
                    type="url"
                    defaultValue={social[red.clave] ?? ""}
                    placeholder={`https://${red.clave === "x" ? "x.com" : red.clave + ".com"}/micolegio`}
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Déjalo vacío para no mostrar este icono.
                  </p>
                  <FieldError message={fieldErrors?.[`social_${red.clave}`]} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── Niveles ──────────────────────────────────────────────── */}
          <TabsContent value="niveles">
            <div className="space-y-5 px-6 py-5">
              <div>
                <label
                  htmlFor="levelsTitle"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Título de la columna de niveles
                </label>
                <input
                  id="levelsTitle"
                  name="levelsTitle"
                  type="text"
                  defaultValue={initialData.levelsTitle ?? ""}
                  className={inputClass}
                />
                <FieldError message={fieldErrors?.levelsTitle} />
              </div>

              {levels.map((nivel, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-zinc-200 p-4 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <div>
                    <label
                      htmlFor={`level_${i}_name`}
                      className="block text-sm font-medium text-zinc-700"
                    >
                      Texto
                    </label>
                    <input
                      id={`level_${i}_name`}
                      name={`level_${i}_name`}
                      type="text"
                      defaultValue={nivel.name ?? ""}
                      placeholder="Ej. Preescolar"
                      className={inputClass}
                    />
                    <FieldError message={fieldErrors?.[`level_${i}_name`]} />
                  </div>
                  <div>
                    <label
                      htmlFor={`level_${i}_href`}
                      className="block text-sm font-medium text-zinc-700"
                    >
                      Página de destino
                    </label>
                    <select
                      id={`level_${i}_href`}
                      name={`level_${i}_href`}
                      defaultValue={nivel.href ?? ""}
                      className={inputClass}
                    >
                      <option value="">Elige una página…</option>
                      {PAGINAS_FOOTER.map((pagina) => (
                        <option key={pagina} value={pagina}>
                          {pagina}
                        </option>
                      ))}
                    </select>
                    <FieldError message={fieldErrors?.[`level_${i}_href`]} />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeNivel(i)}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addNivel}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
              >
                + Agregar nivel
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {state.ok ? (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
        >
          Footer guardado. Aparecerá en la web tras el rebuild.
        </p>
      ) : null}
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar footer" />
    </form>
  );
}
