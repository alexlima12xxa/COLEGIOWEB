"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { NoticiaState } from "./actions";
import { crearNoticia, actualizarNoticia } from "./actions";
import { mediaUrl } from "@/lib/storage";
import type { NoticiaRow } from "./types";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20";

export function NoticiaForm({ noticia }: { noticia?: NoticiaRow }) {
  const router = useRouter();
  const isEdit = Boolean(noticia);
  const [state, formAction, pending] = useActionState<NoticiaState, FormData>(
    isEdit ? actualizarNoticia.bind(null, noticia!.id) : crearNoticia,
    {},
  );

  const [storedPath] = useState<string>(noticia?.imagen_path ?? "");
  const [preview, setPreview] = useState<string | undefined>(
    mediaUrl(noticia?.imagen_path),
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    router.push("/admin/noticias");
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="imagen_path" value={storedPath} />

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
            defaultValue={noticia?.titulo}
            placeholder="Ej. Celebración del Día del Estudiante"
            className={inputClass}
          />
          <FieldError message={state.fieldErrors?.titulo} />
        </div>

        <div>
          <label htmlFor="autor" className="block text-sm font-medium text-zinc-700">
            Autor
          </label>
          <input
            id="autor"
            name="autor"
            type="text"
            defaultValue={noticia?.autor ?? ""}
            placeholder="Ej. Dirección General"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="resumen" className="block text-sm font-medium text-zinc-700">
          Resumen
        </label>
        <textarea
          id="resumen"
          name="resumen"
          rows={3}
          defaultValue={noticia?.resumen ?? ""}
          placeholder="Breve descripción que aparece en las tarjetas de la web."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contenido" className="block text-sm font-medium text-zinc-700">
          Contenido (Markdown) <span className="text-red-600">*</span>
        </label>
        <textarea
          id="contenido"
          name="contenido"
          rows={14}
          required
          defaultValue={noticia?.contenido}
          placeholder={"## Subtítulo\n\nTexto de la noticia. Soporta **negritas**, _cursivas_, listas y enlaces."}
          className={`${inputClass} font-mono`}
        />
        <FieldError message={state.fieldErrors?.contenido} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <label htmlFor="imagen_alt" className="block text-sm font-medium text-zinc-700">
            Texto alternativo de la imagen
          </label>
          <input
            id="imagen_alt"
            name="imagen_alt"
            type="text"
            defaultValue={noticia?.imagen_alt ?? ""}
            placeholder="Descripción breve para accesibilidad"
            className={inputClass}
          />
        </div>

        <div>
          <span className="block text-sm font-medium text-zinc-700">Portada</span>
          <input
            ref={fileRef}
            id="imagen"
            name="imagen"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFile}
            className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
          />
          <p className="mt-1 text-xs text-zinc-500">
            {fileName ? `Seleccionado: ${fileName}` : noticia?.imagen_path ? "Imagen actual: ver previsualización." : "Sube una imagen (JPG, PNG, WebP o AVIF)."}
          </p>
        </div>
      </div>

      {preview ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa de la portada"
            className="h-40 w-full rounded-lg object-cover ring-1 ring-zinc-200"
          />
        </div>
      ) : null}

      <label className="flex items-center gap-2.5 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="publicado"
          defaultChecked={noticia ? noticia.publicado : true}
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
          {pending ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear noticia"}
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
