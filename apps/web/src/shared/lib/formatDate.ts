const LONG_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const SHORT_FORMATTER = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function toDate(iso: string): Date {
  // Las fechas sin hora (columna date de Postgres) se parsean a mediodía UTC
  // para no desplazarse de día en zonas horarias negativas.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return new Date(`${iso}T12:00:00`);
  return new Date(iso);
}

export function formatLongDate(iso: string): string {
  const date = toDate(iso);
  return Number.isNaN(date.getTime()) ? iso : LONG_FORMATTER.format(date);
}

export function formatShortDate(iso: string): string {
  const date = toDate(iso);
  return Number.isNaN(date.getTime()) ? iso : SHORT_FORMATTER.format(date);
}
