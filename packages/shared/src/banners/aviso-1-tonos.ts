// Tonos de la plantilla `aviso-1`. Opciones controladas: el director elige
// entre estas, nunca color libre. El color del tono se aplica a la vez al
// texto del título y al fondo del CTA (--banner-a1-tone). La forma blanca y el
// texto del botón (#FFFFFF) son fijos por diseño.

export interface TonoAviso1 {
  key: string;
  label: string;
  /** Hex que pinta el título y el fondo del CTA. */
  color: string;
}

export const AVISO_1_TONOS: TonoAviso1[] = [
  { key: "azul", label: "Azul institucional", color: "#00379D" },
  { key: "rojo", label: "Rojo", color: "#B20003" },
];

export function tonoAviso1PorKey(key: string): TonoAviso1 {
  return AVISO_1_TONOS.find((t) => t.key === key) ?? AVISO_1_TONOS[0];
}
