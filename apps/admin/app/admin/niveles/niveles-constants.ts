// Constantes del módulo "niveles" compartidas entre el server action y el
// formulario cliente. NO es un módulo "use server": los archivos "use server"
// solo pueden exportar funciones async, y exportar constantes desde ahí rompe
// el bundle cliente (NIVELES llegaba como no-array → t.map is not a function).
export const NIVELES = [
  { clave: "preescolar", label: "Preescolar" },
  { clave: "primaria", label: "Primaria" },
  { clave: "secundaria", label: "Secundaria" },
  { clave: "media-tecnica", label: "Media Técnica" },
] as const;

export type NivelClave = (typeof NIVELES)[number]["clave"];