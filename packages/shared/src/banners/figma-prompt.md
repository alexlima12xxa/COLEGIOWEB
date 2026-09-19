# Prompt: Figma → Banner web (Google AI Studio)

Este es el prompt que se pega en Google AI Studio **junto con la captura/imagen
del diseño de Figma** para generar el CSS + HTML de una plantilla de banner.

Regla de oro: **antes de enviar, llena cada sección `FICHA:` con los valores
EXACTOS que ves en el Figma** (hex, px, comportamiento móvil). La estructura
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
(El canvas es único: en móvil se escala el mismo diseño. Indica aquí SOLO si el
 diseño móvil difiere de verdad (ej: "ocultar foto", "foto arriba y texto abajo").
 Si se deja vacío, aplica el escalado del canvas.)


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
     decorativas) y variables del contrato. NO declares height, min-height, padding ni reglas
     globales de imagen: el marco lo aporta la base (su alto = alto del canvas).
   - Capa INTERNA <div class="banner__container">: envuelve TODO el contenido del banner.
     La base ya le aporta width, max-width, aspect-ratio y container-type.
     NO vuelvas a declarar esas propiedades: declara solo su layout
     (display, grid-template-columns/flex, gap, align/justify, padding).
6. CANVAS (Arquitectura A — canvas único escalado):
   - Todas las plantillas comparten el canvas 1600 × 720.
   - Declara SIEMPRE en la raíz, con números SIN unidad:
       .banner--<SLUG> { --banner-canvas-w: 1600; --banner-canvas-h: 720; }
   - NUNCA declares la propiedad aspect-ratio directamente (la aporta la base).
   - El marco (.banner) NO tiene alto propio: su alto = alto del canvas.
7. SISTEMA DE COORDENADAS (cqw):
   - El canvas es un contenedor de consulta: 1cqw = 1% del ancho del canvas
     (16px a 1600px). Conversión: pxFigma / 16 = cqw.
   - Expresa TODAS las medidas interiores en cqw: top, left, width, height,
     font-size, line-height, gap, padding y radios.
   - PROHIBIDO: % vertical, vh/vw, rem/px crudos y line-height: normal.
8. TEXTO — SEPARAR ESTILO DE GEOMETRÍA:
   - La plantilla aporta el ESTILO: font-family, font-size (cqw), line-height
     EXPLÍCITO (cqw o unitless), font-weight, color, letter-spacing, text-align.
   - El motor aporta la GEOMETRÍA: la caja de contención (.banner__content) y el
     recorte por líneas. Declara el techo del bloque de contenido con:
       .banner--<SLUG> { --banner-content-max-h: <alto en cqw>; }
   - Si el diseño muestra más de 2 líneas de título o más de 3 de subtítulo, declara:
       .banner--<SLUG> { --banner-title-lineas: <n>; --banner-subtitle-lineas: <n>; }
   - PROHIBIDO line-height: normal. Usa el line-height exacto del Figma.
9. ZONAS DE IMAGEN / ASSETS:
   Para CADA zona de imagen <zona> (ej: foto, fondo, silueta, overlay), la estructura HTML obligatoria es:
   <div class="banner__<SLUG>-<zona>">
     <img ... />
   </div>
   Requisitos CSS:
   - La caja se define SOLO con coordenadas de Figma en cqw (top, left, width,
     height, rotate):
       .banner__<SLUG>-<zona> { position: absolute; top: …; left: …; width: …; height: …; }
   - Si el elemento está rotado en Figma, aplica rotate(<grados>) sobre la caja.
   - La imagen SIEMPRE rellena la caja:
       .banner__<SLUG>-<zona> img { position: absolute; inset: 0; width: 100%; height: 100%;
                                    object-fit: cover; object-position: center; }
   - object-fit: cover para fotos rectangulares; contain para cutouts/PNG con alfa
     o cuando el asset trae el marco integrado (no debe recortarse).
   - PROHIBIDO poner background-color, border ni drop-shadow en la caja de la foto
     (eso genera un marco que el diseño no pide). Si el diseño pide sombra, se
     aplica sobre la IMAGEN, no sobre la caja.
   - Si el diseño tiene un MARCO especial (bordes irregulares, festoneado,
     transparencias), se renderiza como una CAPA OVERLAY SVG/PNG por encima de la
     foto (z-index superior), con la MISMA caja que la foto. Nunca como estilo de
     la foto ni de su caja.
   - Campo destino del panel (repórtalo en la FICHA): image | background | assets[].
   - Si el asset trae el marco integrado, indícalo y exige PNG/AVIF con alfa.
10. MODO DE CANVAS (dedúcelo del CSS de Figma y repórtalo en la FICHA LEÍDA):
    - CONTENED ("contained"): los elementos tienen márgenes internos respecto al lienzo.
    - FULL-BLEED: los elementos tocan 0px o tienen width: 100% respecto al lienzo.
    En ambos casos el contenido vive dentro de .banner__container.
11. RESPONSIVE: el canvas es único; en móvil se escala el mismo diseño. Declara un
    override SOLO si el diseño móvil difiere de verdad.
12. ESTRUCTURA Y LAYOUT (agnóstico, dictado 100% por el CSS de Figma):
    - Analiza dimensiones del lienzo y coordenadas (left, top, width) del CSS de Figma.
    - Si hay texto sobre imagen, resuélvelo con z-index o superposición.
    - NO asumas 2 columnas: respeta el número de zonas (1, 2, 3 o N) del diseño.
13. NO JavaScript, NO TypeScript.
14. TEXTOS EDITABLES — usar las CLASES BASE del sistema, NO crear clases propias:
    - kicker    → <span class="banner__kicker">
    - título    → <h1 class="banner__title">
    - subtítulo → <p class="banner__subtitle">
    Los overrides del diseño se escanean con la raíz: .banner--<SLUG> .banner__title { ... }
15. CONTENIDO: envuelve kicker + título + subtítulo + CTA en
    <div class="banner__content banner__content--<SLUG>"> ... </div>
    (el motor base aporta flex column, la caja de contención y z-index).
    Va DENTRO de <div class="banner__container">.
16. Botones de acción:
    - HTML: <div class="bannerActions"></div> (estrictamente vacío; el sistema lo llena).
    - El sistema renderiza <a class="btn btn--primary btn--lg">.
    - CSS: estilar sobre
      .banner--<SLUG> .bannerActions a,
      .banner--<SLUG> .bannerActions button,
      .banner--<SLUG> .bannerActions > * { ... }
      (medidas en cqw).
17. TIPOGRAFÍA:
    - Extrae familias, pesos, interlineados y tamaños del CSS de Figma.
    - Convierte cada tamaño e interlineado a cqw: px / 16.
    - Usa tokens del sitio: var(--font-display, "Outfit", sans-serif) para títulos y
      var(--font-sans, "Inter", sans-serif) para kicker/subtítulo/CTA.
    - NO incluir @font-face ni @import de fuentes.
    - PROHIBIDO line-height: normal.
18. VARIANTES DE TONO (THEMING):
    - Declara en la raíz los valores por defecto del diseño:
      .banner--<SLUG> { --banner-bg: <hex>; --banner-title-color: <hex>; ... }
    - Consume esas variables en las reglas: color: var(--banner-title-color, <hex>).
    - NO uses el atributo data-tone ni style inline en el scaffold.
19. El bloque HTML devuelto debe contener ÚNICAMENTE la etiqueta <article> raíz y sus
    hijos (sin <html>, <head> ni <body>).


═══════════════════════════════════════════════
ENTREGA ESPERADA (EXACTAMENTE ESTOS 3 BLOQUES)
═══════════════════════════════════════════════
Devuelve EXACTAMENTE estos 3 bloques separados por una línea con "---":

1. FICHA LEÍDA: tu interpretación técnica para validación humana. Campos OBLIGATORIOS:
   - slug confirmado.
   - Canvas: 1600 × 720 (confirmar).
   - Tipo de layout (contened / full-bleed).
   - Fondo: color sólido / degradado / imagen full-bleed (hex o asset).
   - Caja de contenido: top / left / width / height (px Figma).
   - Line-heights exactos de kicker, título y subtítulo.
   - Zonas de imagen / assets: para cada una:
       rol (foto | fondo | silueta | overlay) · campo destino (image | background |
       assets[]) · editable sí/no · requerido sí/no · alfa sí/no ·
       tamaño de subida retina ×2 · object-fit · top / left / width / height / rotate.
   - Overlay de marco: sí/no + asset (o "integrado en la imagen").
   - CTA: label · href · variante · caja (x/y/w/h) · font/size/weight/line-height ·
     color/bg/radius/padding/sombra.
   - CTA secundario / actions: sí/no.
   - Textos de ejemplo (copy LITERAL que precarga el panel).
   - Contrato de campos: key · label en el panel · tipo · opcional · maxLength sugerido.
   - Paleta base en hex + variables themables (tonos).
   - Tipografías detectadas (familia, peso, tamaño, line-height).
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
   con contrato, campos, `ejemplo`, `anchoFigma: 1600` y `altoFigma: 720`.
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
| Fondo full-bleed 2400×1080 | 4800×2160 |
| Silueta PNG 400×600 | 800×1200 |
