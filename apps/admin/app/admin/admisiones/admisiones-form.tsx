"use client";

import { useActionState, useState } from "react";
import type { AdmisionesState } from "./actions";
import { guardarAdmisiones } from "./actions";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/admin/components/tabs";
import { CollapsibleCard } from "@/app/admin/components/collapsible-card";

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

const ESTADOS = [
  { value: "en-curso", label: "En curso" },
  { value: "ultimos-cupos", label: "Últimos cupos" },
  { value: "familias-admitidas", label: "Familias admitidas" },
] as const;

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

function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
    >
      {label}
    </button>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
    >
      {label}
    </button>
  );
}

export interface FechaClaveItem {
  title?: string;
  date?: string;
  estado?: string;
  description?: string;
}

export interface EtapaItem {
  title?: string;
  description?: string;
  pie?: string;
}

export interface RequisitoItem {
  title?: string;
  description?: string;
  formato?: string;
}

export interface FaqItem {
  title?: string;
  content?: string;
}

export interface AdmisionesData {
  periodLabel?: string;
  heroBadge?: string;
  heroTitlePre?: string;
  heroTitleHighlight?: string;
  heroDescription?: string;
  aviso?: string;
  fechasClave?: FechaClaveItem[];
  etapas?: EtapaItem[];
  requisitosPorNivel?: Record<string, RequisitoItem[]>;
  faq?: FaqItem[];
}

const NIVELES = [
  { key: "preescolar", label: "Preescolar" },
  { key: "primaria", label: "Primaria" },
  { key: "secundaria", label: "Secundaria" },
] as const;

// Información de un nivel para la sub-tab Requisitos. Las claves
// (preescolar/primaria/secundaria) son el contrato de datos: nunca cambian.
// `name` es el nombre real editable en el módulo "Niveles", o el label fijo.
export interface NivelInfo {
  key: string;
  label: string;
  name: string;
}

const NIVELES_DEFAULT: NivelInfo[] = NIVELES.map((nivel) => ({
  key: nivel.key,
  label: nivel.label,
  name: nivel.label,
}));

const SUBTABS = [
  "resumen",
  "fechas",
  "etapas",
  "requisitos",
  "faq",
] as const;
type Subtab = (typeof SUBTABS)[number];

const SUBTAB_LABELS: Record<Subtab, string> = {
  resumen: "Resumen",
  fechas: "Fechas clave",
  etapas: "Etapas",
  requisitos: "Requisitos",
  faq: "Preguntas frecuentes",
};

const emptyFecha: FechaClaveItem = { title: "", date: "", estado: "en-curso", description: "" };
const emptyEtapa: EtapaItem = { title: "", description: "", pie: "" };
const emptyRequisito: RequisitoItem = { title: "", description: "", formato: "" };

export function AdmisionesForm({
  initial,
  niveles = NIVELES_DEFAULT,
}: {
  initial: AdmisionesData;
  niveles?: NivelInfo[];
}) {
  const [state, formAction, pending] = useActionState<AdmisionesState, FormData>(
    guardarAdmisiones,
    {},
  );

  const [fechasClave, setFechasClave] = useState<FechaClaveItem[]>(
    initial.fechasClave && initial.fechasClave.length > 0 ? initial.fechasClave : [emptyFecha],
  );
  const [etapas, setEtapas] = useState<EtapaItem[]>(
    initial.etapas && initial.etapas.length > 0 ? initial.etapas : [emptyEtapa],
  );
  const [requisitos, setRequisitos] = useState<Record<string, RequisitoItem[]>>(() => {
    const base: Record<string, RequisitoItem[]> = {};
    for (const nivel of NIVELES) {
      const items = initial.requisitosPorNivel?.[nivel.key];
      base[nivel.key] = items && items.length > 0 ? items : [emptyRequisito];
    }
    return base;
  });
  const [faq, setFaq] = useState<FaqItem[]>(
    initial.faq && initial.faq.length > 0 ? initial.faq : [{ title: "", content: "" }],
  );

  const addFecha = () =>
    setFechasClave((prev) => [...prev, { ...emptyFecha, estado: "en-curso" }]);
  const removeFecha = (i: number) =>
    setFechasClave((prev) => prev.filter((_, idx) => idx !== i));

  const addEtapa = () => setEtapas((prev) => [...prev, { ...emptyEtapa }]);
  const removeEtapa = (i: number) => setEtapas((prev) => prev.filter((_, idx) => idx !== i));

  const addRequisito = (nivel: string) =>
    setRequisitos((prev) => ({ ...prev, [nivel]: [...prev[nivel], { ...emptyRequisito }] }));
  const removeRequisito = (nivel: string, i: number) =>
    setRequisitos((prev) => ({
      ...prev,
      [nivel]: prev[nivel].filter((_, idx) => idx !== i),
    }));

  const addFaq = () => setFaq((prev) => [...prev, { title: "", content: "" }]);
  const removeFaq = (i: number) => setFaq((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <Tabs defaultValue="resumen" order={[...SUBTABS]}>
          <TabsList aria-label="Secciones de admisiones">
            {SUBTABS.map((sub) => (
              <TabsTrigger key={sub} value={sub}>
                {SUBTAB_LABELS[sub]}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Resumen: periodo, aviso y textos del hero */}
          <TabsContent value="resumen">
            <div className="space-y-5 px-6 py-5">
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

              <div>
                <label htmlFor="aviso" className="block text-sm font-medium text-zinc-700">
                  Aviso destacado
                </label>
                <textarea
                  id="aviso"
                  name="aviso"
                  rows={2}
                  defaultValue={initial.aviso ?? ""}
                  placeholder="Ej. El número de vacantes es limitado por nivel para mantener un ratio máximo de 22 alumnos por aula."
                  className={inputClass}
                />
                <FieldError message={state.fieldErrors?.aviso} />
              </div>

              <div className="border-t border-zinc-100 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Textos del hero de la página de admisiones
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Estos textos aparecen en la portada de la página de admisiones de la web.
                </p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="heroBadge" className="block text-sm font-medium text-zinc-700">
                      Badge (etiqueta superior)
                    </label>
                    <input
                      id="heroBadge"
                      name="heroBadge"
                      type="text"
                      defaultValue={initial.heroBadge ?? ""}
                      placeholder="Ej. Convocatoria 2026 Abierta"
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.heroBadge} />
                  </div>
                  <div>
                    <label htmlFor="heroTitlePre" className="block text-sm font-medium text-zinc-700">
                      Pre-título
                    </label>
                    <input
                      id="heroTitlePre"
                      name="heroTitlePre"
                      type="text"
                      defaultValue={initial.heroTitlePre ?? ""}
                      placeholder="Ej. El futuro de tus hijos comienza aquí: "
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.heroTitlePre} />
                  </div>
                  <div>
                    <label htmlFor="heroTitleHighlight" className="block text-sm font-medium text-zinc-700">
                      Título resaltado (en color)
                    </label>
                    <input
                      id="heroTitleHighlight"
                      name="heroTitleHighlight"
                      type="text"
                      defaultValue={initial.heroTitleHighlight ?? ""}
                      placeholder="Ej. Admisiones 2026"
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.heroTitleHighlight} />
                  </div>
                  <div>
                    <label htmlFor="heroDescription" className="block text-sm font-medium text-zinc-700">
                      Descripción
                    </label>
                    <textarea
                      id="heroDescription"
                      name="heroDescription"
                      rows={3}
                      defaultValue={initial.heroDescription ?? ""}
                      placeholder="Ej. Inicia el proceso de admisión para que tu hijo o hija haga parte de nuestra comunidad educativa."
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.heroDescription} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Fechas clave */}
          <TabsContent value="fechas">
            <div className="space-y-3 px-6 py-5">
              {fechasClave.map((item, i) => (
                <div key={i} className="space-y-3 rounded-lg border border-zinc-100 p-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label htmlFor={`fecha_title-${i}`} className="block text-sm font-medium text-zinc-700">
                        Título
                      </label>
                      <input
                        id={`fecha_title-${i}`}
                        name="fecha_title"
                        type="text"
                        defaultValue={item.title ?? ""}
                        placeholder="Ej. Inicio de Postulaciones"
                        className={inputClass}
                      />
                      <FieldError message={state.fieldErrors?.[`fecha_title-${i}`]} />
                    </div>
                    <div>
                      <label htmlFor={`fecha_date-${i}`} className="block text-sm font-medium text-zinc-700">
                        Fecha
                      </label>
                      <input
                        id={`fecha_date-${i}`}
                        name="fecha_date"
                        type="text"
                        defaultValue={item.date ?? ""}
                        placeholder="Ej. 1 de Septiembre, 2025"
                        className={inputClass}
                      />
                      <FieldError message={state.fieldErrors?.[`fecha_date-${i}`]} />
                    </div>
                    <div>
                      <label htmlFor={`fecha_estado-${i}`} className="block text-sm font-medium text-zinc-700">
                        Estado
                      </label>
                      <select
                        id={`fecha_estado-${i}`}
                        name="fecha_estado"
                        defaultValue={item.estado ?? "en-curso"}
                        className={inputClass}
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado.value} value={estado.value}>
                            {estado.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor={`fecha_description-${i}`} className="block text-sm font-medium text-zinc-700">
                      Descripción
                    </label>
                    <textarea
                      id={`fecha_description-${i}`}
                      name="fecha_description"
                      rows={2}
                      defaultValue={item.description ?? ""}
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.[`fecha_description-${i}`]} />
                  </div>
                  <RemoveButton onClick={() => removeFecha(i)} label="Eliminar fecha" />
                </div>
              ))}
              <AddButton onClick={addFecha} label="+ Agregar fecha clave" />
            </div>
          </TabsContent>

          {/* Etapas */}
          <TabsContent value="etapas">
            <div className="space-y-3 px-6 py-5">
              {etapas.map((item, i) => (
                <div key={i} className="space-y-3 rounded-lg border border-zinc-100 p-3">
                  <div>
                    <label htmlFor={`etapa_title-${i}`} className="block text-sm font-medium text-zinc-700">
                      Título
                    </label>
                    <input
                      id={`etapa_title-${i}`}
                      name="etapa_title"
                      type="text"
                      defaultValue={item.title ?? ""}
                      placeholder="Ej. Inscripción en línea"
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.[`etapa_title-${i}`]} />
                  </div>
                  <div>
                    <label htmlFor={`etapa_description-${i}`} className="block text-sm font-medium text-zinc-700">
                      Descripción
                    </label>
                    <textarea
                      id={`etapa_description-${i}`}
                      name="etapa_description"
                      rows={2}
                      defaultValue={item.description ?? ""}
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.[`etapa_description-${i}`]} />
                  </div>
                  <div>
                    <label htmlFor={`etapa_pie-${i}`} className="block text-sm font-medium text-zinc-700">
                      Pie de tarjeta
                    </label>
                    <input
                      id={`etapa_pie-${i}`}
                      name="etapa_pie"
                      type="text"
                      defaultValue={item.pie ?? ""}
                      placeholder="Ej. Formato 100% digital"
                      className={inputClass}
                    />
                    <FieldError message={state.fieldErrors?.[`etapa_pie-${i}`]} />
                  </div>
                  <RemoveButton onClick={() => removeEtapa(i)} label="Eliminar etapa" />
                </div>
              ))}
              <AddButton onClick={addEtapa} label="+ Agregar etapa" />
            </div>
          </TabsContent>

          {/* Requisitos por nivel */}
          <TabsContent value="requisitos">
            <div className="space-y-3 px-6 py-5">
              {niveles.map((nivel, idx) => (
                <CollapsibleCard
                  key={nivel.key}
                  id={`requisitos-${nivel.key}`}
                  title={nivel.name}
                  defaultOpen={idx === 0}
                  keepMounted
                >
                  <div className="space-y-3">
                    {requisitos[nivel.key]?.map((item, i) => (
                      <div key={i} className="space-y-2 rounded-lg border border-zinc-100 p-2">
                        <input
                          name={`req_${nivel.key}_title`}
                          type="text"
                          defaultValue={item.title ?? ""}
                          placeholder="Título del documento"
                          className={inputClass}
                        />
                        <FieldError message={state.fieldErrors?.[`req_${nivel.key}_title-${i}`]} />
                        <textarea
                          name={`req_${nivel.key}_desc`}
                          rows={2}
                          defaultValue={item.description ?? ""}
                          placeholder="Descripción / especificaciones"
                          className={inputClass}
                        />
                        <FieldError message={state.fieldErrors?.[`req_${nivel.key}_desc-${i}`]} />
                        <input
                          name={`req_${nivel.key}_formato`}
                          type="text"
                          defaultValue={item.formato ?? ""}
                          placeholder="Formato (ej. PDF o JPG legible máx. 5MB)"
                          className={inputClass}
                        />
                        <FieldError message={state.fieldErrors?.[`req_${nivel.key}_formato-${i}`]} />
                        <RemoveButton
                          onClick={() => removeRequisito(nivel.key, i)}
                          label="Eliminar requisito"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <AddButton
                      onClick={() => addRequisito(nivel.key)}
                      label={`+ Agregar requisito (${nivel.name})`}
                    />
                  </div>
                </CollapsibleCard>
              ))}
            </div>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq">
            <div className="space-y-3 px-6 py-5">
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
                      placeholder="Ej. ¿Cuáles son los criterios de selección?"
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
                  <RemoveButton onClick={() => removeFaq(i)} label="Eliminar pregunta" />
                </div>
              ))}
              <AddButton onClick={addFaq} label="+ Agregar pregunta" />
            </div>
          </TabsContent>
        </Tabs>
      </div>

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