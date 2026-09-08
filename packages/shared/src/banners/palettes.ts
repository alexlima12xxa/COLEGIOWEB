// Paletas de color controladas de los banners.
// ---------------------------------------------------------------------------
// El director NO elige colores libres: elige entre "pares/tons" pre-armados que
// tú defines aquí al diseñar cada banner en Figma. Así la dirección de arte se
// respeta siempre. Estas paletas se usan tanto en el panel (para generar los
// selectores) como en los componentes Astro (para mapear clave → color real).

export interface TonoPrueba {
  key: string;
  label: string;
  color1: string;
  color2: string;
  acento: string;
}

// Tonos de la plantilla "prueba": gradiente diagonal + acento inferior.
export const PRUEBA_TONOS: TonoPrueba[] = [
  { key: "nocheMarino", label: "Noche × Marino", color1: "#0b1f3a", color2: "#1e3a8a", acento: "#38bdf8" },
  { key: "tealCoral", label: "Teal × Coral", color1: "#0f5c5c", color2: "#c07a2d", acento: "#fbbf24" },
  { key: "lilaDorado", label: "Lila × Dorado", color1: "#3b2f6b", color2: "#8b5cf6", acento: "#f59e0b" },
];

export function tonoPruebaPorKey(key: string): TonoPrueba {
  return PRUEBA_TONOS.find((t) => t.key === key) ?? PRUEBA_TONOS[0];
}