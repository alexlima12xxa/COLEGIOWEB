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


[MODO DE LAYOUT]:
(Elige uno de los dos modos. Si se deja vacío, usa "altura viewport".

 AMBOS modos comparten estructura HÍBRIDA: fondo full-bleed (100% de ancho) +
 contenido en una caja centrada con max-width: 100rem (1600px). Lo que cambia
 es cómo se calcula la ALTURA.

 - "altura viewport": hero de impacto. La altura la dicta el viewport
   (min-height: 90dvh en móvil / 80vh en desktop). Layout desktop-first.

 - "altura proporcional": banner tipo tarjeta, fiel al lienzo. La altura la dicta
   la proporción del lienzo Figma con `aspect-ratio: <ancho> / <alto>` sobre el
   contenedor centrado (max-width). El escalado interno usa container queries
   (`container-type: inline-size`) y unidades `cqw`. Layout mobile-first.
   ESTÁNDAR: el ancho del lienzo Figma == max-width del contenedor (1600px =
   100rem). Así `px Figma = px CSS` (1:1) y no hay conversión manual.
   Ejemplo: lienzo 1600×645 → aspect-ratio: 1600 / 645.)


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
5. ALTURA / LAYOUT según el [MODO DE LAYOUT] elegido:
   - Estructura HÍBRIDA (en AMBOS modos):
     - El fondo (color/gradiente/foto de ambiente) es full-bleed: el <article>
       ocupa width: 100% y su background-color llega de borde a borde.
     - El contenido vive en una caja centrada con max-width: 100rem (1600px).
   - Modo "altura viewport" (por defecto):
     - Móvil: min-height: 90dvh; height: 90dvh;
     - Desktop: min-height: 80vh; height: 80vh;
     - Layout desktop-first (overrides con @media (max-width: 48rem)).
   - Modo "altura proporcional":
     - El contenedor centrado define la altura con la proporción EXACTA del
       lienzo Figma: aspect-ratio: <anchoFigma> / <altoFigma>;
       (ej. lienzo 1600×645 → aspect-ratio: 1600 / 645; NO usar 80vh).
     - El contenedor centrado usa max-width: 100rem (1600px) y
       container-type: inline-size para habilitar cqw.
     - ESTÁNDAR DE LIENZO: el ancho del lienzo Figma == max-width del contenedor
       (1600px). Así px Figma = px CSS (1:1). El ancho del lienzo NO altera el
       CSS: `%` y `cqw` son proporciones, de modo que un lienzo de 2400 o de 1600
       producen los MISMOS valores; el 1600 solo evita conversiones manuales.
     - Layout mobile-first: la base describe el móvil (apilado) y
       @media (min-width: 48rem) describe el desktop.
     - En móvil el aspect-ratio del lienzo suele quedar demasiado bajo: rompe
       la proporción con un layout apilado (foto + tarjeta), tamaños fijos en rem
       y padding propio. El lienzo Figma solo gobierna el desktop.
6. Responsive con 2 breakpoints:
   - max-width: 48rem (móvil) — en modo "altura viewport" (desktop-first).
   - min-width: 48rem (desktop) — en modo "altura proporcional" (mobile-first).
   - min-width: 64rem (desktop grande) — opcional, para ajustes finos.
   Usa UNA sola dirección de overrides por plantilla; no mezcles mobile-first
   y desktop-first en el mismo archivo.
7. ESTRUCTURA Y LAYOUT (agnóstico, dictado 100% por el CSS de Figma):
   - Analiza dimensiones del lienzo y coordenadas (left, top, width) del CSS de Figma.
   - Si los elementos flotan con márgenes amplios respecto al lienzo, NO los pegues a los
     bordes: agrúpalos en un contenedor con max-width / centrado para que no se dispersen
     en monitores anchos (1920px+).
   - Si tocan 0px o tienen width 100%, deben ser full-bleed (borde a borde).
   - Si hay texto sobre imagen, resuélvelo con z-index o superposición de grid.
   - NO asumas 2 columnas: respeta el número de zonas (1, 2, 3 o N) del diseño.
   - CONVERSIÓN px → %: convierte cada left/top/width/height del CSS de Figma a
     porcentaje del lienzo (valor / ancho o alto del lienzo × 100). Así el layout
     escala solo y no depende de medidas fijas. El % resultante es idéntico con
     cualquier ancho de lienzo (es una proporción).
   - WRAPPER "CARD": cuando una forma (vector/fondo) es el fondo del texto en
     móvil pero en desktop va posicionada de forma absoluta, envuelve la forma +
     el contenido en un contenedor posicionado (ej. `.banner__<slug>-card`) que
     haga de contexto común. En móvil el wrapper es `position: relative` con la
     forma en `position: absolute; inset: 0` como fondo; en desktop el wrapper es
     `position: absolute; inset: 0` y la forma/contenido se posicionan dentro.
8. NO JavaScript, NO TypeScript.
9. TEXTOS EDITABLES — usar las CLASES BASE del sistema, NO crear clases propias:
   - kicker    → <span class="banner__kicker">
   - título    → <h1 class="banner__title">
   - subtítulo → <p class="banner__subtitle">
   Los overrides del diseño se escanean con la raíz:
   .banner--<SLUG> .banner__title { ... }
   Si el diseño muestra más de 2 líneas de título o más de 3 de subtítulo, declara:
   .banner--<SLUG> { --banner-title-lineas: <n>; --banner-subtitle-lineas: <n>; }
10. CONTENIDO: envuelve kicker + título + subtítulo + CTA en
    <div class="banner__content banner__content--<SLUG>"> ... </div>
    (el sistema base aporta flex column, gap y z-index sobre las imágenes).
    - Reordenar en móvil SIN tocar el HTML: usa `order` en el contenedor flex.
      (ej. `.banner__<slug>-foto { order: -1 }` sube la foto arriba del texto;
      resetea `order: 0` en desktop).
11. Botones de acción:
    - HTML: <div class="bannerActions"></div> (estrictamente vacío; el sistema lo llena).
    - El sistema renderiza <a class="btn btn--primary btn--lg">.
    - CSS: estilar sobre
      .banner--<SLUG> .bannerActions a,
      .banner--<SLUG> .bannerActions button,
      .banner--<SLUG> .bannerActions > * { ... }
12. ZONAS DE IMAGEN:
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
    - FORMAS VECTORIALES (SVG) QUE CAMBIAN DE COLOR POR TONO:
      Si una forma del Figma (rectángulo, blob, marco) debe cambiar de color
      según el tono, NO la pongas como archivo <img>. Inlínala en el HTML:
      <div class="banner__<SLUG>-<zona>">
        <svg viewBox="..." preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="..."/></svg>
      </div>
      y controla el color por CSS:
      .banner__<SLUG>-<zona> svg path { fill: var(--banner-<tono>, <hex>); }
      IMPORTANTE: `object-fit` NO aplica a SVG inline. Para recortar/mantener la
      curva usa el atributo `preserveAspectRatio` (xMidYMid slice = llena y
      recorta; xMidYMid meet = encaja sin recortar). El SVG inline no puede ser
      campo `imagen` del contrato (es parte del diseño, no contenido editable).
13. TIPOGRAFÍA:
    - Extrae familias, pesos, interlineados y tamaños del CSS de Figma (px a rem: px / 16).
    - Usa tokens del sitio: var(--font-display, "Outfit", sans-serif) para títulos y
      var(--font-sans, "Inter", sans-serif) para kicker/subtítulo/CTA.
    - NO incluir @font-face ni @import de fuentes.
    - Si el diseño usa una fuente que no está self-hosted, indícala en
      [FUENTE PERSONALIZADA] (se instala fuera del banner; ver README).
    - MODO "ALTURA PROPORCIONAL": expresa los tamaños en cqw (relativo al
      contenedor), no en vw. Fórmula: px_figma / ancho_lienzo × 100 = cqw.
      (ej. 59.69px sobre lienzo 1600 → 3.73cqw). La fórmula es agnóstica al
      ancho del lienzo: el mismo diseño da el mismo cqw con 1600 o con 2400.
      Acota con clamp(): font-size: clamp(<mín-rem>, <cqw>, <máx-rem>);
    - MODO "ALTURA PROPORCIONAL" en móvil: usa tamaños fijos en rem (más
      predecibles que cqw en viewports pequeños).
14. VARIANTES DE TONO (THEMING):
    - Declara en la raíz los valores por defecto del diseño:
      .banner--<SLUG> { --banner-bg: <hex>; --banner-title-color: <hex>; ... }
    - Consume esas variables en las reglas: color: var(--banner-title-color, <hex>).
    - NO uses el atributo data-tone ni style inline en el scaffold: la inyección del
      tono se hace en la integración Astro desde la paleta.
15. El bloque HTML devuelto debe contener ÚNICAMENTE la etiqueta <article> raíz y sus
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
   - Tono → se inyecta vía `style` inline desde `palettes.ts` (NO data-tone).
   - Importa `base.css` + `<slug>.css`.
4. **`catalogo.ts`** — agregar slug a `BANNERS_SLUGS` + entrada en `CATALOGO_BANNERS`
   con contrato, campos y `ejemplo`.
5. **`palettes.ts`** — registrar los tonos con sus hex exactos.
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

Exporta CADA zona a ×2 de su tamaño real en el lienzo (no del lienzo completo).
Ejemplos:

| Zona en Figma | Imagen a subir |
|---------------|----------------|
| Foto lateral 600×900 | 1200×1800 |
| Fondo full-bleed 1920×1080 | 3840×2160 |
| Silueta PNG 400×600 | 800×1200 |

Lienzo estándar del modo "altura proporcional": **1600×645** (== max-width
100rem). En "altura viewport" el lienzo puede ser 1440 o 1920; el alto lo dicta
el viewport (80vh en desktop).
