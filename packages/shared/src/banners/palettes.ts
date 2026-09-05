// Paletas de color controladas de los banners.
// ---------------------------------------------------------------------------
// El director NO elige colores libres: elige entre "pares/tons" pre-armados que
// tú defines aquí al diseñar cada banner en Figma. Así la dirección de arte se
// respeta siempre. Estas paletas se usan tanto en el panel (para generar los
// selectores) como en los componentes Astro (para mapear clave → color real).

export interface ParDuotono {
  key: string;
  label: string;
  color1: string;
  color2: string;
}

export interface TonoGranulado {
  key: string;
  label: string;
  color: string;
}

// Pares de duotono (gradiente) del banner "duotono".
export const DUOTONO_PARES: ParDuotono[] = [
  { key: "azulTeal", label: "Azul × Teal", color1: "#1e2a44", color2: "#0f5c5c" },
  { key: "vinoOcre", label: "Vino × Ocre", color1: "#3a1f2a", color2: "#c07a2d" },
  { key: "oxfordPlata", label: "Oxford × Plata", color1: "#0b1f3a", color2: "#9fb3c8" },
];

// Tonos base del banner "granulado" (color sólido + ruido).
export const GRANULADO_TONOS: TonoGranulado[] = [
  { key: "marino", label: "Azul marino", color: "#16264a" },
  { key: "grafito", label: "Grafito", color: "#232323" },
  { key: "esmeralda", label: "Esmeralda", color: "#0d3b2e" },
];

export function parDuotonoPorKey(key: string): ParDuotono {
  return DUOTONO_PARES.find((p) => p.key === key) ?? DUOTONO_PARES[0];
}

export function tonoGranuladoPorKey(key: string): TonoGranulado {
  return GRANULADO_TONOS.find((t) => t.key === key) ?? GRANULADO_TONOS[0];
}