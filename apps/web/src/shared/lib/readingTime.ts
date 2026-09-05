/**
 * Estimación de tiempo de lectura para contenido editorial en Markdown.
 *
 * Convención ~200 palabras por minuto (lectura adulta). Se eliminan los
 * símbolos de Markdown para contar solo texto legible. El resultado nunca
 * es menor a 1 minuto.
 */

const WORDS_PER_MINUTE = 200;

export function readingTimeMin(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~[\]()!|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const count = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(count / WORDS_PER_MINUTE));
}

export function formatReadingTime(min: number): string {
  return min === 1 ? "1 min de lectura" : `${min} min de lectura`;
}
