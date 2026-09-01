// Tokens de marca compartidos entre apps (web, admin, aula).
// NOTA: la fuente de verdad del white-label es apps/web/src/site.config.ts.
// Estos tokens son la versión tipada mínima para que admin/aula muestren
// la identidad del colegio sin importar la configuración de la web.

export interface BrandColors {
  primary: string;
  accent: string;
  surface: string;
  text: string;
}

export interface BrandTokens {
  name: string;
  slogan: string;
  colors: BrandColors;
}

// Valores por defecto (coinciden con el sitio piloto de site.config.ts).
export const defaultBrand: BrandTokens = {
  name: "Colegio Piloto",
  slogan: "Formando líderes para el futuro con excelencia académica",
  colors: {
    primary: "#1e40af",
    accent: "#b45309",
    surface: "#ffffff",
    text: "#1e293b",
  },
};