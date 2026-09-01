"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import type { CircularState } from "./actions";
import { crearCircular, actualizarCircular } from "./actions";
import { mediaUrl } from "@/lib/storage";
import type { CircularRow } from "./types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

export function CircularForm({ circular }: { circular?: CircularRow }) {
  const router = useRouter();
  const isEdit = Boolean(circular);
  const [state, formAction, pending] = useActionState<CircularState, FormData>(
    isEdit ? actualizarCircular.bind(null, circular!.id) : crearCircular,
    {},
  );

  const [fileName, setFileName] = useState<string>("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
  };

  const handleCancel = () => {
    router.push("/admin/circulares");
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="archivo_path" value={circular?.archivo_path ?? ""} />
      <input type="hidden" name="archivo_nombre" value={circular?.archivo_nombre ?? ""} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor="titulo" className="block text-sm font-medium text-zinc-700">
            Título <span className="text-red-600">*</span>
          </label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            required
            defaultValue={circular?.titulo}
            placeholder="Ej. Circular N° 001 - Inicio de clases"
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.titulo} />
        </div>

        <div>
          <label htmlFor="categoria" className="block text-sm font-medium text-zinc-700">
            Categoría
          </label>
          <input
            id="categoria"
            name="categoria"
            type="text"
            defaultValue={circular?.categoria ?? ""}
            placeholder="Ej. Académica, Administrativa"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-zinc-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={circular?.descripcion ?? ""}
          placeholder="Breve resumen del comunicado."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor="fecha" className="block text-sm font-medium text-zinc-700">
            Fecha <span className="text-red-600">*</span>
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            defaultValue={circular?.fecha ?? new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.fecha} />
        </div>

        <div>
          <span className="block text-sm font-medium text-zinc-700">
            Documento (PDF)
          </span>
          <input
            id="archivo"
            name="archivo"
            type="file"
            accept="application/pdf"
            onChange={handleFile}
            className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
          />
          <FieldError message={state.fieldErrors?.archivo} />
          {circular?.archivo_path && !fileName ? (
            <a
              href={mediaUrl(circular.archivo_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
            >
              Ver PDF actual
            </a>
          ) : fileName ? (
            <p className="mt-1 text-xs text-zinc-500">Seleccionado: {fileName}</p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="publicado"
          defaultChecked={circular ? circular.publicado : true}
          className="h-4 w-4 rounded border-zinc-300 text-blue-700 focus:ring-blue-600/40"
        />
        Publicada (visible en la web tras el rebuild)
      </label>

      {state.error ? (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear circular"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}