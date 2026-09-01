"use client";

import { useActionState, useState } from "react";
import type { PortadaState } from "./actions";
import { guardarHero, guardarVideoTour } from "./actions";
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

function FileField({
  id,
  name,
  accept,
  currentPath,
  label,
  hint,
  onChange,
}: {
  id: string;
  name: string;
  accept: string;
  currentPath?: string;
  label: string;
  hint: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-zinc-700">{label}</span>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        onChange={onChange}
        className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
      />
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

interface HeroData {
  heroPhoto?: string;
  name?: string;
  slogan?: string;
  description?: string;
}

export function HeroForm({ initial, heroJson }: { initial: HeroData; heroJson: string }) {
  const [state, formAction, pending] = useActionState<PortadaState, FormData>(
    guardarHero,
    {},
  );
  const [preview, setPreview] = useState<string | undefined>(mediaUrl(initial.heroPhoto));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="hero_json" value={heroJson} />

      <div>
        <label htmlFor="titulo" className="block text-sm font-medium text-zinc-700">
          Título del hero <span className="text-red-600">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          defaultValue={initial.name ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">Entre 2 y 80 caracteres.</p>
        <FieldError message={state.fieldErrors?.titulo} />
      </div>

      <div>
        <label htmlFor="subtitulo" className="block text-sm font-medium text-zinc-700">
          Subtítulo <span className="text-red-600">*</span>
        </label>
        <textarea
          id="subtitulo"
          name="subtitulo"
          rows={2}
          defaultValue={initial.slogan ?? initial.description ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">Entre 2 y 200 caracteres.</p>
        <FieldError message={state.fieldErrors?.subtitulo} />
      </div>

      <FileField
        id="heroPhoto"
        name="heroPhoto"
        accept="image/jpeg,image/png,image/webp,image/avif"
        currentPath={initial.heroPhoto}
        label="Imagen del hero"
        hint="Se sirve optimizada (AVIF/WebP) en la web. Sube una imagen de al menos 1200×900."
        onChange={handlePhoto}
      />

      {preview ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa del hero"
            className="h-44 w-full rounded-lg object-cover ring-1 ring-zinc-200"
          />
        </div>
      ) : null}

      <Status ok={state.ok} />
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar hero" />
    </form>
  );
}

interface VideoTourData {
  videoUrl?: string;
  poster?: string;
  title?: string;
}

export function VideoTourForm({ initial, posterJson }: { initial: VideoTourData; posterJson: string }) {
  const [state, formAction, pending] = useActionState<PortadaState, FormData>(
    guardarVideoTour,
    {},
  );
  const [preview, setPreview] = useState<string | undefined>(mediaUrl(initial.poster));

  const handlePoster = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="poster_json" value={posterJson} />

      <div>
        <label htmlFor="videoUrl" className="block text-sm font-medium text-zinc-700">
          URL del video del tour <span className="text-red-600">*</span>
        </label>
        <input
          id="videoUrl"
          name="videoUrl"
          type="url"
          defaultValue={initial.videoUrl ?? ""}
          placeholder="https://…/tour.mp4"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">Entre 5 y 500 caracteres.</p>
        <FieldError message={state.fieldErrors?.videoUrl} />
      </div>

      <div>
        <label htmlFor="posterTitle" className="block text-sm font-medium text-zinc-700">
          Título del tour
        </label>
        <input
          id="posterTitle"
          name="posterTitle"
          type="text"
          defaultValue={initial.title ?? ""}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-zinc-500">Entre 0 y 200 caracteres.</p>
      </div>

      <FileField
        id="poster"
        name="poster"
        accept="image/jpeg,image/png,image/webp,image/avif"
        currentPath={initial.poster}
        label="Póster del video"
        hint="Imagen de portada del reproductor de video. Se sirve optimizada."
        onChange={handlePoster}
      />

      {preview ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vista previa del póster"
            className="h-44 w-full rounded-lg object-cover ring-1 ring-zinc-200"
          />
        </div>
      ) : null}

      <Status ok={state.ok} />
      {state.error ? <FormError message={state.error} /> : null}

      <SubmitButton pending={pending} label="Guardar video tour" />
    </form>
  );
}
