// Convierte un texto en un slug seguro para URLs/IDs.
// El esquema de la web exige: ^[a-z0-9]+(?:-[a-z0-9]+)*$
export function slugify(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized;
}
