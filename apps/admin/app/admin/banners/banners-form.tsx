"use client";

import { useActionState, useState } from "react";
import type { BannersState } from "./actions";
import { guardarBanner } from "./actions";
import { mediaUrl } from "@/lib/storage";
import {
  CATALOGO_BANNERS,
  catalogoPorSlug,
  parDuotonoPorKey,
  tonoGranuladoPorKey,
  type EditableCampo,
  type OpcionCampo,
} from "@web-modelo/shared";

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

function LivePreview({
  plantillaId,
  datos,
}: {
  plantillaId: string;
  datos: Record<string, unknown>;
}) {
  const str = (v: unknown): string => (typeof v === "string" ? v : "");

  let backgroundStyle: React.CSSProperties = { backgroundColor: "#1e1e2e" };

  if (plantillaId === "duotono") {
    const par = parDuotonoPorKey(str(datos.tono));
    backgroundStyle = {
      backgroundImage: `linear-gradient(135deg, ${par.color1} 0%, ${par.color2} 100%)`,
    };
  } else if (plantillaId === "granulado") {
    const tono = tonoGranuladoPorKey(str(datos.tono));
    backgroundStyle = { backgroundColor: tono.color };
  } else {
    const bg = str(datos.background);
    const bgUrl = bg.startsWith("data:") ? bg : mediaUrl(bg);
    backgroundStyle = {
      backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
      backgroundColor: bgUrl ? undefined : "#1e1e2e",
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }

  return (
    <div
      className="relative h-56 w-full overflow-hidden rounded-xl border border-zinc-200"
      style={backgroundStyle}
    >
      {plantillaId === "granulado" && (
        <div
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundSize: "160px 160px",
          }}
        />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-4 text-center text-white">
        {str(datos.kicker) && (
          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-85">
            {str(datos.kicker)}
          </span>
        )}
        {str(datos.title) && (
          <span className="text-xl font-bold leading-tight">{str(datos.title)}</span>
        )}
        {str(datos.subtitle) && (
          <span className="text-xs opacity-90">{str(datos.subtitle)}</span>
        )}
      </div>
    </div>
  );
}

export function BannerForm({ initial }: { initial: BannerInitial }) {
  const [state, formAction, pending] = useActionState<BannersState, FormData>(
    guardarBanner,
    {},
  );

  const datos = initial.datos ?? {};
  const str = (v: unknown): string => (typeof v === "string" ? v : "");

  const [plantillaId, setPlantillaId] = useState(initial.plantilla_id);
  const [campos, setCampos] = useState<Record<string, string>>({
    title: str(datos.title),
    subtitle: str(datos.subtitle),
    kicker: str(datos.kicker),
    tono: str(datos.tono),
  });
  const [previewDatos, setPreviewDatos] = useState<Record<string, unknown>>(datos);

  const contrato = catalogoPorSlug(plantillaId);
  const ctaObj = datos.cta as { label?: string; href?: string } | undefined;

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
        <input
          id={campo.key}
          name={campo.key}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () =>
              setPreviewDatos((prev) => ({ ...prev, [campo.key]: reader.result as string }));
            reader.readAsDataURL(file);
          }}
          className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
        />
      );
    }

    if (campo.tipo === "texto-largo") {
      return (
        <textarea
          id={campo.key}
          name={campo.key}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className={inputClass}
        />
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
      <input
        id={campo.key}
        name={campo.key}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={inputClass}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="id" value={initial.id ?? ""} />
      <input type="hidden" name="datos_json" value={JSON.stringify(datos)} />

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

      {contrato?.contrato.campos.map((campo) => (
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
            defaultValue={ctaObj?.label ?? ""}
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
            defaultValue={ctaObj?.href ?? ""}
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

      <LivePreview plantillaId={plantillaId} datos={previewDatos} />

      <Status ok={state.ok} />
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label={initial.id ? "Guardar banner" : "Crear banner"} />
    </form>
  );
}