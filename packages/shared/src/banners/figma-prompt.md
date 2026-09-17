# Prompt: Figma → Banner web (Google AI Studio)

Este es el prompt que se pega en Google AI Studio **junto con la captura/imagen
del diseño de Figma** para generar el CSS + HTML de una plantilla de banner.

Regla de oro: **antes de enviar, llena cada sección `FICHA:` con los valores
EXACTOS que ves en el Figma** (hex, px, %, comportamiento móvil). La estructura
(layout) NO se prescribe: el AI la lee de la imagen y la reporta en la **FICHA
LEÍDA** antes de generar el código, para que puedas validarla. El AI no debe
adivinar medidas: cuanto más precisa la ficha, más idéntico el resultado.

---

## El prompt

```text
Eres un ingeniero frontend senior que genera componentes web siguiendo restricciones técnicas estrictas. A partir de la imagen adjunta y los datos de entrada que te proporciono, genera el código de una plantilla de hero/banner para un sitio web educativo (Astro + panel admin).

El CSS debe ser autocontenido y usar CSS custom properties con fallback, porque se renderiza tanto en la web pública como en el preview del panel de control.


═══════════════════════════════════════════════
DATOS DE ENTRADA (LLENADOS POR EL USUARIO)
═══════════════════════════════════════════════
[SLUG DE LA PLANTILLA]:
(Identificador en kebab-case, ej: matricula-nino, hero-admision, tarjeta-foto.)


[FUENTE PERSONALIZADA (OPCIONAL)]:
(Solo indicar si el diseño usa una fuente NUEVA que no es Outfit ni Inter.
 Si usa Outfit (títulos) e Inter (textos), deja este campo vacío.
 Ejemplo: "Nueva fuente para títulos: Playfair Display".)
NOTA: NO agregar @font-face ni @import. Las fuentes son self-hosted globales
y se registran fuera del banner.


[VARIANTES DE TONO / COLOR (OPCIONAL)]:
(Si el diseño admite variantes de color, describe QUÉ variables cambian y sus
hex alternativos. El sistema inyecta estos valores desde la paleta al renderizar.
 Formato:
 - Variables themables: --banner-bg, --banner-title-color, --banner-cta-bg, ...
 - Tono "oscuro": --banner-bg: #0b192c, --banner-title-color: #ffffff
 - Tono "crema":  --banner-bg: #fff8ee, --banner-title-color: #2d3142
 Si no hay variantes, deja este campo vacío.)


[COMPORTAMIENTO MÓVIL ESPECÍFICO (OPCIONAL)]:
(Si hay un requisito especial para móvil, indícalo. Ej: "ocultar foto",
 "foto arriba y texto abajo". Si se deja vacío, aplica apilado vertical estándar.)


[DATOS EXTRAÍDOS DE FIGMA - "Copy as CSS (todas las capas)"]:
(Pega aquí el CSS crudo que copiaste de Figma:
 clic derecho -> Copy/Paste as -> Copy as CSS.)


═══════════════════════════════════════════════
RESTRICCIONES TÉCNICAS (OBLIGATORIAS)
═══════════════════════════════════════════════
1. CSS puro, sin frameworks (NO Tailwind, NO Bootstrap).
2. TODO color, espacio y radio vía CSS custom properties con fallback: var(--nombre, valor-fallback).
3. Todo el CSS dentro de @layer components { ... }.
4. Clase raíz del componente: <article class="banner banner--<SLUG>"> (usando el slug exacto provisto).
5. CONTRATO DE DOS CAPAS (obligatorio — ver README.md §3):
   - Capa EXTERNA <article class="banner banner--<SLUG>">: SOLO fondo (color, degradado, shapes
     decorativas) y variables del contrato. NO declares height, min-height ni padding: el marco
     lo fija la base compartida (80vh desktop / 90dvh móvil).
   - Capa INTERNA <div class="banner__container">: envuelve TODO el contenido del banner.
     La base ya le aporta width: 100%, max-width: var(--banner-container-max, 1600px),
     max-height: 100% y aspect-ratio: var(--banner-aspect-ratio, auto).
     NO vuelvas a declarar esas cuatro propiedades: declara solo su layout
     (display, grid-template-columns/flex, gap, align/justify, padding).
6. MODO DE CANVAS (dedúcelo del CSS de Figma y repórtalo en la FICHA LEÍDA):
   - CONTENED ("contained"): los elementos tienen márgenes internos respecto al lienzo.
     → El contenido vive dentro de .banner__container, con ancho máximo y centrado, para que
       no se disperse en monitores anchos (1920px+).
   - FULL-BLEED: los elementos tocan 0px o tienen width: 100% respecto al lienzo.
     → La superficie va borde a borde (la pinta .banner--<SLUG>), pero el contenido sigue
       dentro de .banner__container.
7. PROPORCIÓN DEL CANVAS (alimenta --banner-aspect-ratio):
   - Mide el frame del lienzo en Figma (ancho × alto) y declara esa proporción EXACTA en la raíz:
     .banner--<SLUG> { --banner-aspect-ratio: <W> / <H>; }
     (ej. canvas 1920×1080 → --banner-aspect-ratio: 1920 / 1080)
   - NUNCA uses la propiedad aspect-ratio directa: la base la resetea en móvil.
   - El alto del marco NO se declara aquí: lo fija la base (80vh / 90dvh).
8. Responsive con 2 breakpoints (los del contrato):
   - max-width: 1023px (móvil/tablet)
   - min-width: 1024px (desktop)
   El layout desktop va SIEMPRE dentro de @media (min-width: 1024px): fuera de la media query
   se filtra al móvil por especificidad y anula el apilado de la base.
9. MOBILE: la base ya aplica apilado vertical (flex column, space-between, centrado) a
   .banner__container en max-width: 1023px. Declara un override SOLO si el diseño móvil
   difiere, con .banner--<SLUG> .banner__container { ... } (nunca con !important).
10. ESTRUCTURA Y LAYOUT (agnóstico, dictado 100% por el CSS de Figma):
    - Analiza dimensiones del lienzo y coordenadas (left, top, width) del CSS de Figma.
    - Si los elementos flotan con márgenes amplios respecto al lienzo, NO los pegues a los
      bordes: agrúpalos en un contenedor con max-width / centrado para que no se dispersen
      en monitores anchos (1920px+).
    - Si tocan 0px o tienen width 100%, deben ser full-bleed (borde a borde).
    - Si hay texto sobre imagen, resuélvelo con z-index o superposición de grid.
    - NO asumas 2 columnas: respeta el número de zonas (1, 2, 3 o N) del diseño.
11. NO JavaScript, NO TypeScript.
12. TEXTOS EDITABLES — usar las CLASES BASE del sistema, NO crear clases propias:
    - kicker    → <span class="banner__kicker">
    - título    → <h1 class="banner__title">
    - subtítulo → <p class="banner__subtitle">
    Los overrides del diseño se escanean con la raíz:
    .banner--<SLUG> .banner__title { ... }
    Si el diseño muestra más de 2 líneas de título o más de 3 de subtítulo, declara:
    .banner--<SLUG> { --banner-title-lineas: <n>; --banner-subtitle-lineas: <n>; }
13. CONTENIDO: envuelve kicker + título + subtítulo + CTA en
    <div class="banner__content banner__content--<SLUG>"> ... </div>
    (el sistema base aporta flex column, gap y z-index sobre las imágenes).
    Va DENTRO de <div class="banner__container">.
14. Botones de acción:
    - HTML: <div class="bannerActions"></div> (estrictamente vacío; el sistema lo llena).
    - El sistema renderiza <a class="btn btn--primary btn--lg">.
    - CSS: estilar sobre
      .banner--<SLUG> .bannerActions a,
      .banner--<SLUG> .bannerActions button,
      .banner--<SLUG> .bannerActions > * { ... }
15. ZONAS DE IMAGEN:
    Para CADA zona de imagen <zona> (ej: foto, fondo, silueta), la estructura HTML obligatoria es:
    <div class="banner__<SLUG>-<zona>">
      <img ... />
    </div>
    Requisitos CSS:
    .banner__<SLUG>-<zona> { position: relative; background-color: var(--banner-<zona>-bg, <color>); overflow: hidden; }
    .banner__<SLUG>-<zona> img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: <cover|contain>; object-position: <posición>; }
    - El background-color del contenedor es OBLIGATORIO (si la imagen es PNG transparente, se ve detrás).
    - Siluetas/PNG recortados: object-fit: contain; anclados a su base (ej. bottom center).
    - Fotos rectangulares o fondos: object-fit: cover; object-position: center.
    - Las zonas de imagen van DENTRO de .banner__container.
16. TIPOGRAFÍA:
    - Extrae familias, pesos, interlineados y tamaños del CSS de Figma (px a rem: px / 16).
    - Usa tokens del sitio: var(--font-display, "Outfit", sans-serif) para títulos y
      var(--font-sans, "Inter", sans-serif) para kicker/subtítulo/CTA.
    - NO incluir @font-face ni @import de fuentes.
17. VARIANTES DE TONO (THEMING):
    - Declara en la raíz los valores por defecto del diseño:
      .banner--<SLUG> { --banner-bg: <hex>; --banner-title-color: <hex>; ... }
    - Consume esas variables en las reglas: color: var(--banner-title-color, <hex>).
    - NO uses el atributo data-tone ni style inline en el scaffold: la inyección del
      tono se hace en la integración Astro desde los tonos de la plantilla.
18. El bloque HTML devuelto debe contener ÚNICAMENTE la etiqueta <article> raíz y sus
    hijos (sin <html>, <head> ni <body>).


═══════════════════════════════════════════════
ENTREGA ESPERADA (EXACTAMENTE ESTOS 3 BLOQUES)
═══════════════════════════════════════════════
Devuelve EXACTAMENTE estos 3 bloques separados por una línea con "---":

1. FICHA LEÍDA: tu interpretación técnica para validación humana (slug confirmado,
   tipo de layout, zonas de imagen con su object-fit y background-color, paleta base
   en hex, variables themables declaradas y tipografías detectadas).
2. BLOQUE CSS: todo el CSS dentro de ```css y ```
3. BLOQUE HTML: el marcado dentro de ```html y ```

NO incluyas explicaciones adicionales, NO incluyas JavaScript ni rutas de archivos.
```

---

## Después del prompt (integración)

El CSS + HTML son el **scaffold**. El flujo al recibirlos:

1. **`packages/shared/src/banners/css/<slug>.css`** — el CSS tal cual.
2. **`packages/shared/package.json`** — agregar el export del CSS nuevo
   (`"./banners/css/<slug>.css": "./src/banners/css/<slug>.css"`).
3. **`apps/web/.../templates/Banner<X>.astro`** — traduzco el HTML:
   - Cada `.banner__<slug>-<zona>` recibe un `<img src={resolveAssetUrl(...)}>` real
     (campos `datos.background`, `datos.image`, `datos.assets[]` u otro campo `imagen`).
   - Textos → `datos.kicker/title/subtitle`; CTA → `<BannerActions>`.
    - Tono → se inyecta vía `style` inline desde los tonos de la plantilla
      (`<slug>-tonos.ts`; `palettes.ts` se eliminó junto con la plantilla `prueba`)
      (NO data-tone).
    - Importa `base.css` + `<slug>.css`.
4. **`catalogo.ts`** — agregar slug a `BANNERS_SLUGS` + entrada en `CATALOGO_BANNERS`
   con contrato, campos y `ejemplo`.
5. **`<slug>-tonos.ts`** — registrar los tonos con sus hex exactos y exportarlo en
   `banners/index.ts` (solo si la plantilla tiene variantes de color).
6. **`HomeBanner.astro`** — registrar el componente en `COMPONENTES`.
7. Verificar: `pnpm --filter @web-modelo/shared test` + `web check` + `web build` + `admin build`.

### Flujo de imágenes

| Paso | Quién | Acción |
|------|-------|--------|
| 1 | Tú | Subes la captura del Figma al AI Studio |
| 2 | AI | Genera CSS + HTML (scaffold) |
| 3 | Tú | Implementas el template `.astro` + CSS |
| 4 | Director | Sube la imagen real por el panel admin |
| 5 | Admin | Sube a bucket `media` (Supabase) → se renderiza con `<img>` |

La captura que subes al AI Studio es **solo** para leer el diseño.

### Tamaño de imagen (retina ×2)

| Zona en Figma | Imagen a subir |
|---------------|----------------|
| Foto lateral 600×900 | 1200×1800 |
| Fondo full-bleed 2400×1088 | 4800×2176 |
| Silueta PNG 400×600 | 800×1200 |
