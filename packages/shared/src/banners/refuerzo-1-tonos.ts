// Tonos de la plantilla `refuerzo-1`. Opciones controladas: el director elige
// entre estas, nunca color libre. El color del tono se aplica a la vez a la
// forma decorativa (--banner-blue) y al texto del CTA (--banner-cta-color).

export interface TonoRefuerzo1 {
  key: string;
  label: string;
  /** Hex que pinta la forma azul y el texto del botón. */
  color: string;
}

export const REFUERZO_1_TONOS: TonoRefuerzo1[] = [
  { key: "azul", label: "Azul institucional", color: "#00209e" },
  { key: "rojo", label: "Rojo", color: "#b10f01" },
  { key: "petroleo", label: "Petróleo", color: "#056778" },
];

export function tonoRefuerzo1PorKey(key: string): TonoRefuerzo1 {
  return REFUERZO_1_TONOS.find((t) => t.key === key) ?? REFUERZO_1_TONOS[0];
}
