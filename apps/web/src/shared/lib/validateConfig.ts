import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { siteConfig } from "../../site.config";

/**
 * Build-time validation for the white-label configuration.
 *
 * This module is executed at the top of astro.config.ts so any invalid
 * configuration (insufficient contrast, missing assets, bad WhatsApp number,
 * over-long copy) fails the build before Astro starts compiling.
 */

type HexColor = `#${string}`;
type ColorKey = keyof typeof siteConfig.branding.colors;

const MIN_CONTRAST_RATIO = 4.5;
const WHATSAPP_REGEX = /^\+[1-9]\d{6,14}$/;

interface ContrastPair {
  label: string;
  foreground: ColorKey;
  background: ColorKey;
}

const REQUIRED_CONTRAST_PAIRS: ContrastPair[] = [
  {
    label: "Texto principal sobre superficie",
    foreground: "text",
    background: "surface",
  },
  {
    label: "Texto secundario sobre superficie",
    foreground: "textMuted",
    background: "surface",
  },
  {
    label: "Texto sutil sobre superficie",
    foreground: "textSubtle",
    background: "surface",
  },
  {
    label: "Texto inverso sobre superficie inversa",
    foreground: "textInverse",
    background: "surfaceInverse",
  },
  {
    label: "Color primario sobre superficie",
    foreground: "primary",
    background: "surface",
  },
  {
    label: "Color primario sobre versión suave",
    foreground: "primary",
    background: "primarySoft",
  },
  {
    label: "Acento sobre superficie",
    foreground: "accent",
    background: "surface",
  },
  {
    label: "Éxito sobre superficie",
    foreground: "success",
    background: "surface",
  },
  {
    label: "Advertencia sobre superficie",
    foreground: "warning",
    background: "surface",
  },
  {
    label: "Peligro sobre superficie",
    foreground: "danger",
    background: "surface",
  },
  {
    label: "Información sobre superficie",
    foreground: "info",
    background: "surface",
  },
];

function hexToSrgbChannels(hex: HexColor): [number, number, number] {
  const clean = hex.replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    throw new Error(`Color HEX inválido: ${hex}`);
  }

  const bigint = parseInt(clean, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;

  return [r, g, b];
}

function channelToLinear(channel: number): number {
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: HexColor): number {
  const [r, g, b] = hexToSrgbChannels(hex).map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: HexColor, background: HexColor): number {
  const lumA = relativeLuminance(foreground) + 0.05;
  const lumB = relativeLuminance(background) + 0.05;
  return lumA > lumB ? lumA / lumB : lumB / lumA;
}

function validateTextLengths(errors: string[]): void {
  const nameLength = siteConfig.identity.name.length;
  const sloganLength = siteConfig.identity.slogan.length;

  if (nameLength > 40) {
    errors.push(
      `identity.name excede los 40 caracteres permitidos (${nameLength} caracteres): "${siteConfig.identity.name}"`,
    );
  }

  if (sloganLength > 80) {
    errors.push(
      `identity.slogan excede los 80 caracteres permitidos (${sloganLength} caracteres): "${siteConfig.identity.slogan}"`,
    );
  }
}

function validateWhatsApp(errors: string[]): void {
  const whatsapp = siteConfig.contact.whatsapp;

  if (!WHATSAPP_REGEX.test(whatsapp)) {
    errors.push(
      `contact.whatsapp no cumple el formato internacional E.164: "${whatsapp}". ` +
        `Debe comenzar con "+" seguido de 7 a 15 dígitos (sin espacios ni guiones).`,
    );
  }
}

function validateAssets(errors: string[]): void {
  // logo y logoInverse son opcionales: si un colegio los omite, el componente
  // Logo usa el fallback generado. El filtro de tipo excluye undefined y
  // strings vacíos, por lo que solo se valida la existencia de archivos
  // cuando el path SÍ está definido.
  const assetPaths = [
    siteConfig.branding.assets.logo,
    siteConfig.branding.assets.logoInverse,
    siteConfig.branding.assets.favicon,
    siteConfig.branding.assets.ogImage,
    siteConfig.branding.assets.tourVideoPoster,
    siteConfig.seo.ogImage,
  ].filter(
    (path): path is string => typeof path === "string" && path.length > 0,
  );

  const uniqueAssetPaths = Array.from(new Set(assetPaths));

  for (const assetPath of uniqueAssetPaths) {
    if (!assetPath.startsWith("/branding/")) {
      errors.push(`El asset "${assetPath}" debe estar bajo /branding/.`);
      continue;
    }

    const filePath = resolve(
      process.cwd(),
      "public",
      assetPath.replace(/^\//, ""),
    );

    if (!existsSync(filePath)) {
      errors.push(
        `Asset de marca no encontrado: ${assetPath} (se buscó en ${filePath}).`,
      );
    }
  }
}

/**
 * Valida que los enlaces internos de la config apunten a páginas reales.
 * Evita CTAs muertos como `ctaUrl: "#contacto"` (ancla inexistente en la
 * mayoría de páginas) o rutas a páginas no creadas.
 */
function validateInternalLinks(errors: string[]): void {
  const ctaUrl = siteConfig.admissions.ctaUrl;

  if (ctaUrl.startsWith("#")) {
    errors.push(
      `admissions.ctaUrl es solo un ancla ("${ctaUrl}"): el ancla no existe en todas las páginas. ` +
        `Usa una ruta interna completa, ej. "/admisiones#formulario".`,
    );
    return;
  }

  if (!ctaUrl.startsWith("/")) return; // Externa: fuera de alcance local.

  const pathname = ctaUrl.split("#")[0].split("?")[0];
  if (pathname === "/") return; // Home: src/pages/index.astro siempre existe.
  if (pathname.includes("[")) return; // Ruta dinámica: no verificable en build.

  // El path relativo no puede empezar con "/": resolve() interpretaría
  // "/admisiones.astro" como absoluto y descartaría pagesDir.
  const normalized = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  const pagesDir = resolve(process.cwd(), "src", "pages");
  const candidates = [
    resolve(pagesDir, `${normalized}.astro`),
    resolve(pagesDir, normalized, "index.astro"),
  ];

  if (!candidates.some((candidate) => existsSync(candidate))) {
    errors.push(
      `admissions.ctaUrl apunta a una página inexistente: "${ctaUrl}" ` +
        `(se buscó src/pages${normalized}.astro).`,
    );
  }
}

function validateContrast(errors: string[]): void {
  for (const pair of REQUIRED_CONTRAST_PAIRS) {
    const foreground = siteConfig.branding.colors[pair.foreground] as HexColor;
    const background = siteConfig.branding.colors[pair.background] as HexColor;
    const ratio = contrastRatio(foreground, background);

    if (ratio < MIN_CONTRAST_RATIO) {
      errors.push(
        `Contraste insuficiente para "${pair.label}". ` +
          `Ratio calculado: ${ratio.toFixed(2)}:1 (mínimo ${MIN_CONTRAST_RATIO}:1). ` +
          `${pair.foreground}=${foreground}, ${pair.background}=${background}.`,
      );
    }
  }
}

export function validateConfig(): void {
  const errors: string[] = [];

  validateTextLengths(errors);
  validateWhatsApp(errors);
  validateAssets(errors);
  validateContrast(errors);
  validateInternalLinks(errors);

  if (errors.length > 0) {
    console.error("\n❌ Validación de site.config.ts falló:\n");
    for (const error of errors) {
      console.error(`  • ${error}`);
    }
    console.error(
      "\nCorrige los errores en src/site.config.ts antes de continuar el build.\n",
    );
    process.exit(1);
  }

  console.log(
    "✅ site.config.ts validado correctamente (contraste, WhatsApp, assets, textos, enlaces).",
  );
}
