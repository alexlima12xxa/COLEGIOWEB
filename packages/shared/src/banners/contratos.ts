// Tipos del "contrato de edición" de un banner.
// ---------------------------------------------------------------------------
// Cada banner (componente Astro) exporta un `EditableSchema` que describe qué
// campos puede editar el director y con qué opciones. Este contrato NO se
// persiste en Supabase: vive en código (git) y es lo que el panel admin usa
// para GENERAR el formulario dinámicamente. Supabase solo guarda el contenido
// resultante en `datos jsonb`.

export type EditableCampoTipo = "texto" | "texto-largo" | "imagen" | "opciones" | "booleano";

export interface OpcionCampo {
  label: string;
  value: string;
}

export interface EditableCampo {
  /** Clave del campo en `datos` (ej. "titulo", "tono", "foto"). */
  key: string;
  /** Etiqueta humana para el formulario. */
  label: string;
  tipo: EditableCampoTipo;
  /** Para `opciones`: lista de opciones válidas (el director elige una). */
  opciones?: OpcionCampo[];
  /** Si puede quedar vacío. */
  opcional?: boolean;
  /** Ayuda/instrcciones bajo el campo. */
  ayuda?: string;
}

export interface EditableSchema {
  /** Slug del banner (coincide con la clave del catálogo). */
  slug: string;
  /** Nombre visible en el panel. */
  nombre: string;
  /** Campos que el director puede editar, en orden de aparición. */
  campos: EditableCampo[];
}