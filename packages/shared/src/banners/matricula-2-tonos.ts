// Tonos de la plantilla `matricula-2`. Opciones controladas: el director elige
// entre estas, nunca color libre. El tono cambia a la vez el degradado del fondo
// (Frame 1) y el color del texto del CTA.

export interface TonoMatricula2 {
  key: string;
  label: string;
  /** Degradado CSS completo para el fondo (Frame 1). */
  degradado: string;
  /** Color del texto del CTA (botón). */
  ctaTexto: string;
}

export const MATRICULA_2_TONOS: TonoMatricula2[] = [
  {
    key: "rojo",
    label: "Rojo",
    degradado: "linear-gradient(180deg, #B20003 67.79%, #4C0001 100%)",
    ctaTexto: "#CD2727",
  },
  {
    key: "azul",
    label: "Azul",
    degradado: "linear-gradient(180deg, #25D0FF 67.79%, #00546B 100%)",
    ctaTexto: "#00546B",
  },
];

export function tonoMatricula2PorKey(key: string): TonoMatricula2 {
  return MATRICULA_2_TONOS.find((t) => t.key === key) ?? MATRICULA_2_TONOS[0];
}