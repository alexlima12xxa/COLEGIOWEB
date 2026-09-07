"use client";

import {
  useActionState,
  useEffect,
  useState,
} from "react";
import type { BannersState } from "./actions";
import { guardarBanner, subirImagenBanner } from "./actions";
import {
  CATALOGO_BANNERS,
  catalogoPorSlug,
  type EditableCampo,
  type OpcionCampo,
} from "@web-modelo/shared";

type OnEdit = (key: string, value: unknown) => void;

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";
const labelClass = "block text-sm font-medium text-zinc-700";

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

function Status({ ok }: { ok?: boolean }) {
  if (!ok) return null;
  return (
    <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
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

export interface BannerInitial {
  id?: string;
  plantilla_id: string;
  orden: number;
  activo: boolean;
  datos: Record<string, unknown>;
}

function buildPreviewUrl(
  plantillaId: string,
  datos: Record<string, unknown>,
  previewToken: string | null,
): string | null {
  const base = process.env.NEXT_PUBLIC_WEB_URL?.replace(/\/+$/, "");
  if (!base || !previewToken) return null;

  const payload: Record<string, unknown> = {
    plantillaId,
    datos,
  };
  const encoded = encodeURIComponent(JSON.stringify(payload));
  return `${base}/preview-admin?token=${encodeURIComponent(previewToken)}&datos=${encoded}`;
}

function BannerPreviewIframe({
  plantillaId,
  datos,
  previewToken,
}: {
  plantillaId: string;
  datos: Record<string, unknown>;
  previewToken: string | null;
}) {
  const url = buildPreviewUrl(plantillaId, datos, previewToken);

  if (!url) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
        Vista previa desactivada: define{" "}
        <code className="text-zinc-700">NEXT_PUBLIC_WEB_URL</code> y{" "}
        <code className="text-zinc-700">PREVIEW_SIGNING_KEY</code> para
        previsualizar el banner con el diseño real.
      </div>
    );
  }

  return (
    <div className="banner-preview">
      <iframe
        key={url}
        src={url}
        title="Vista previa del banner"
        className="h-full w-full border-0"
        loading="lazy"
      />
    </div>
  );
}

export function BannerForm({
  initial,
  previewToken,
}: {
  initial: BannerInitial;
  previewToken?: string | null;
}) {
  const [state, formAction, pending] = useActionState<BannersState, FormData>(
    guardarBanner,
    {},
  );

  const datos = initial.datos ?? {};
  const str = (v: unknown): string => (typeof v === "string" ? v : "");

  const [plantillaId, setPlantillaId] = useState(initial.plantilla_id);

  const contrato = catalogoPorSlug(plantillaId);
  const camposContrato = contrato?.contrato.campos ?? [];

  // Inicialización dinámica desde el contrato: cada campo parte de su valor en
  // `datos` o de su `default`, de modo que plantillas con campos arbitrarios
  // (fotoDerecha, colorFranja, etc.) funcionen sin tocar código por campo.
  const [campos, setCampos] = useState<Record<string, string>>(() => {
    const inicial: Record<string, string> = {};
    for (const c of camposContrato) {
      inicial[c.key] = str(datos[c.key]) || c.default || "";
    }
    return inicial;
  });
  const [previewDatos, setPreviewDatos] = useState<Record<string, unknown>>(() => {
    const inicial: Record<string, unknown> = { ...datos };
    for (const c of camposContrato) {
      if (inicial[c.key] === undefined && c.default) inicial[c.key] = c.default;
    }
    return inicial;
  });

  const ctaObj = previewDatos.cta as { label?: string; href?: string } | undefined;
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
  const setImageError = (key: string, error?: string) =>
    setImageErrors((prev) => {
      const next = { ...prev };
      if (error) next[key] = error;
      else delete next[key];
      return next;
    });

  // Callback del CTA: escribe el objeto cta en previewDatos (fuente de verdad
  // del borrador que alimenta el iframe y el `datos_json` al guardar).
  const onEdit: OnEdit = (key, value) => {
    if (key === "cta") {
      const { label, href } = value as { label?: string; href?: string };
      setPreviewDatos((prev) => ({
        ...prev,
        cta: label && href ? { label, href, variant: "primary" } : undefined,
      }));
    }
  };

  // Al cambiar de plantilla, re-inicializa campos y preview con el contrato
  // nuevo (nombres/valores de campos distintos) y repone los defaults.
  useEffect(() => {
    const inicialCampos: Record<string, string> = {};
    const inicialDatos: Record<string, unknown> = { ...datos };
    for (const c of camposContrato) {
      const actual = str(datos[c.key]);
      inicialCampos[c.key] = actual || c.default || "";
      if (inicialDatos[c.key] === undefined && c.default) {
        inicialDatos[c.key] = c.default;
      }
    }
    setCampos(inicialCampos);
    setPreviewDatos(inicialDatos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantillaId]);

  function renderCampo(campo: EditableCampo) {
    const value = campos[campo.key] ?? "";
    const setValue = (v: string) => {
      setCampos((prev) => ({ ...prev, [campo.key]: v }));
      setPreviewDatos((prev) => ({ ...prev, [campo.key]: v }));
    };

    if (campo.tipo === "opciones") {
      const opciones: OpcionCampo[] = campo.opciones ?? [];
      return (
        <select
          id={campo.key}
          name={campo.key}
          value={value || opciones[0]?.value || ""}
          onChange={(e) => setValue(e.target.value)}
          className={inputClass}
        >
          {opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }

    if (campo.tipo === "imagen") {
      return (
        <>
          <input
            id={campo.key}
            name={campo.key}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await subirImagenBanner(fd);
              if (res.error) {
                setImageError(campo.key, res.error);
                return;
              }
              setImageError(campo.key, undefined);
              setPreviewDatos((prev) => ({ ...prev, [campo.key]: res.path }));
            }}
            className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
          />
          {imageErrors[campo.key] ? (
            <p className="mt-1 text-sm text-red-600">{imageErrors[campo.key]}</p>
          ) : null}
        </>
      );
    }

    if (campo.tipo === "texto-largo") {
      return (
        <>
          <textarea
            id={campo.key}
            name={campo.key}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            maxLength={campo.maxLength}
            className={inputClass}
          />
          {campo.maxLength ? (
            <p className="mt-1 text-xs text-zinc-500">
              {value.length} / {campo.maxLength}
            </p>
          ) : null}
        </>
      );
    }

    if (campo.tipo === "booleano") {
      return (
        <input
          id={campo.key}
          name={campo.key}
          type="checkbox"
          defaultChecked={value === "true" || value === "on"}
          className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600/40"
        />
      );
    }

    return (
      <>
        <input
          id={campo.key}
          name={campo.key}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={campo.maxLength}
          className={inputClass}
        />
        {campo.maxLength ? (
          <p className="mt-1 text-xs text-zinc-500">
            {value.length} / {campo.maxLength}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={initial.id ?? ""} />
      <input type="hidden" name="datos_json" value={JSON.stringify(previewDatos)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="plantilla_id" className={labelClass}>
            Plantilla <span className="text-red-600">*</span>
          </label>
          <select
            id="plantilla_id"
            name="plantilla_id"
            value={plantillaId}
            onChange={(e) => setPlantillaId(e.target.value)}
            className={inputClass}
          >
            {CATALOGO_BANNERS.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.plantillaId} />
        </div>
      </div>

      {contrato?.contrato.campos
        .filter((campo) => campo.key !== "actions")
        .map((campo) => (
          <div key={campo.key}>
            <label htmlFor={campo.key} className={labelClass}>
              {campo.label}
              {!campo.opcional && <span className="text-red-600"> *</span>}
            </label>
            {renderCampo(campo)}
            {campo.ayuda && <p className="mt-1 text-xs text-zinc-500">{campo.ayuda}</p>}
          </div>
        ))}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ctaLabel" className={labelClass}>
            Texto del botón (CTA)
          </label>
          <input
            id="ctaLabel"
            name="ctaLabel"
            type="text"
            value={ctaObj?.label ?? ""}
            onChange={(e) =>
              onEdit("cta", { label: e.target.value, href: ctaObj?.href ?? "" })
            }
            placeholder="Iniciar admisión"
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.ctaLabel} />
        </div>

        <div>
          <label htmlFor="ctaHref" className={labelClass}>
            Enlace del botón
          </label>
          <input
            id="ctaHref"
            name="ctaHref"
            type="text"
            value={ctaObj?.href ?? ""}
            onChange={(e) =>
              onEdit("cta", { label: ctaObj?.label ?? "", href: e.target.value })
            }
            placeholder="/admisiones"
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.ctaHref} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="orden" className={labelClass}>
            Orden
          </label>
          <input
            id="orden"
            name="orden"
            type="number"
            min={0}
            max={999}
            defaultValue={initial.orden}
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.orden} />
        </div>

        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              name="activo"
              defaultChecked={initial.activo}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600/40"
            />
            Activo
          </label>
        </div>
      </div>

      <BannerPreviewIframe
        plantillaId={plantillaId}
        datos={previewDatos}
        previewToken={previewToken ?? null}
      />

      <Status ok={state.ok} />
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label={initial.id ? "Guardar banner" : "Crear banner"} />
    </form>
  );
}