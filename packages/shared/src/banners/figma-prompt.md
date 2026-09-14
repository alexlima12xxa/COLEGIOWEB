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
Eres un ingeniero frontend que genera componentes web siguiendo restricciones técnicas estrictas. A partir de la imagen de diseño que te adjunto, genera el código de un componente hero/banner para un sitio web educativo.

Este banner se integra en un sistema existente (Astro + panel admin). El CSS debe ser autocontenido y usar variables con fallback, porque se renderiza tanto en la web como en el preview del panel.

═══════════════════════════════════════════════
RESTRICCIONES TÉCNICAS (OBLIGATORIAS)
═══════════════════════════════════════════════
1. CSS puro, sin frameworks (NO Tailwind, NO Bootstrap).
2. TODO color y espacio vía CSS custom properties con fallback: var(--nombre, valor-fallback).
3. Todo el CSS dentro de @layer components { ... }.
4. Clase raíz del componente: class="banner banner--<SLUG>" (slug corto en kebab-case, ej: "tarjeta-foto").
5. Responsive con 2 breakpoints:
   - max-width: 48rem (móvil)
   - min-width: 64rem (desktop grande)
6. Altura del hero:
   - Móvil: min-height: 90dvh; height: 90dvh;
   - Desktop: min-height: 90vh; height: 90vh;
7. NO JavaScript, NO TypeScript.
8. Textos editables, sin clases que restrinjan el contenido:
   - kicker → <span class="banner__<SLUG>-kicker">
   - título → <h1 class="banner__<SLUG>-title">
   - subtítulo → <p class="banner__<SLUG>-subtitle">
9. Botones de acción: <div class="bannerActions"></div> (vacío; el sistema lo llena después). Si el diseño usa botones con look propio, estila .bannerActions a, .bannerActions button, .bannerActions > * (el sistema renderiza <a class="btn btn--primary btn--lg">).
10. ZONAS DE IMAGEN — CRÍTICO: el diseño puede tener UNA O VARIAS zonas de imagen (foto lateral, fondo full-bleed, franja, etc.), en cualquier posición. El sistema renderiza un <img> REAL dentro de cada contenedor (no un div placeholder). Para CADA zona <zona> (ej: foto, fondo, foto-lateral) el CSS debe funcionar con esta estructura:
    <div class="banner__<SLUG>-<zona>">
      <img ... />
    </div>
    Requisitos del contenedor:
      .banner__<SLUG>-<zona> { position: relative; background-color: <color>; overflow: hidden; }
      .banner__<SLUG>-<zona> img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: <cover|contain>; object-position: <posición>; }
    El background-color del contenedor es OBLIGATORIO (es parte del diseño: si la imagen es PNG transparente, se ve el color detrás).
    Si hay texto SUPERPUESTO sobre una imagen (fondo), el bloque de texto lleva un z-index mayor que la imagen.
11. TIPOGRAFÍA DEL SITIO (usa estos tokens como fallback, NO system-ui a pelo):
    - Títulos: font-family: var(--font-display, "Outfit", system-ui, sans-serif);
    - Kicker/subtítulo/CTA: font-family: var(--font-sans, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
    - Espaciados: usa var(--space-xs|sm|md|lg|xl, <px/rem>) con fallback.
12. El HTML es solo la estructura del componente (sin <html>, <head>, <body>).
13. Si el diseño tiene variantes de color (tonos), decláralas en la PALETA (qué variables cambian y con qué hex). NO inventes tonos que no estén en el diseño.

═══════════════════════════════════════════════
FICHA DE ESPECIFICACIÓN — LLENA CADA PUNTO CON VALORES REALES DEL FIGMA
═══════════════════════════════════════════════
[PALETA DE COLORES — hex exactos del Figma]
- Fondo del banner: #______
- Color del kicker: #______
- Color del título: #______
- Color del subtítulo: #______
- Fondo de la zona de foto: #______
- CTA: fondo #______ / hover #______ / texto #______
- Variantes de tono (si existen): por cada tono, qué variables cambia y con qué hex.

[TIPOGRAFÍA — px del Figma, conviértelos a rem (px / 16)]
- Kicker: tamaño desktop y móvil, peso, letter-spacing, transform (uppercase?).
- Título: tamaño desktop y móvil, peso, line-height, letter-spacing.
- Subtítulo: tamaño desktop y móvil, peso, line-height, max-width.
- CTA: tamaño, peso, padding vertical/horizontal, radio.

[ESPACIADO — px del Figma]
- Padding horizontal del contenedor.
- Gap entre columnas.
- Márgenes entre kicker → título → subtítulo → CTA.

[ESTRUCTURA DEL LAYOUT — la dicta el DISEÑO, no este prompt]
Analiza la imagen y enumera las ZONAS del componente (1, 2, 3 o las que tenga el diseño). Para cada zona:
- Nombre (ej: zona-texto, zona-foto, zona-fondo, zona-cta).
- Qué contiene (kicker/título/subtítulo, imagen, botones).
- Posición en el layout (izquierda/derecha/arriba/abajo/fondo absoluto/superpuesta).
- Tamaño (px o % del banner).
- Alineación del contenido dentro de la zona.
Para CADA zona de imagen: object-fit (cover/contain), object-position y background-color.
Ejemplos válidos: texto sobre foto de fondo full-bleed, foto arriba y texto abajo, foto a la izquierda, 3 bloques, texto superpuesto a la imagen… NO asumas 2 columnas.

[COMPORTAMIENTO RESPONSIVE]
- Móvil (max-width: 48rem): ¿apila en 1 columna? ¿orden (texto arriba, foto abajo)? altura de la foto en px, tamaños de texto reducidos.
- Desktop grande (min-width: 64rem): cambios de padding, gap, tamaños.

[DESCRIPCIÓN DEL DISEÑO]
Describe en 1-2 frases el diseño tal como se ve (ej: "Layout de 2 columnas: izquierda kicker grande, título enorme y CTA; derecha foto del niño con birrete que llena la altura del banner anclada abajo").

═══════════════════════════════════════════════
ENTREGA ESPERADA
═══════════════════════════════════════════════
Devuelve EXACTAMENTE estos 3 bloques separados por una línea vacía con "---":
1. FICHA LEÍDA: tu interpretación del diseño (zonas, posiciones, tamaños, colores, tipografías) para que el usuario valide que leíste bien el Figma.
2. BLOQUE CSS: todo el CSS entre ```css y ```
3. BLOQUE HTML: todo el HTML entre ```html y ```

NO incluyas explicaciones adicionales, NO incluyas JavaScript, NO incluyas imports ni rutas de archivos.
```

---

## Después del prompt (integración)

El CSS + HTML generados son el **scaffold**. Al pasármelos, el flujo es:

1. **`packages/shared/src/banners/css/<slug>.css`** — el CSS tal cual (ya cumple: `@layer components`, vars con fallback, breakpoints).
2. **`apps/web/.../templates/Banner<X>.astro`** — traduzco el HTML: cada zona de imagen (`.banner__<slug>-<zona>`) recibe un `<img>` real con la URL de su campo (`datos.background`, `datos.image`, `datos.assets[]` u otros campos `imagen` del contrato); los textos se conectan a sus campos (`datos.kicker/title/subtitle` y campos extra); el CTA a `<BannerActions>`. Las imágenes del banner son `<img>` directos (JPG/PNG/WebP/AVIF); para **PNG transparente**, el contenedor lleva `background-color` (obligatorio). El sistema soporta N zonas de imagen: cada una es un campo `imagen` del contrato (no hace falta tocar el servidor, el panel las sube al instante y guarda las rutas en `datos`).
3. **`catalogo.ts` + `COMPONENTES` de `HomeBanner.astro` + export en `package.json`** — registro de la plantilla, incluyendo su `ejemplo` (datos de muestra que el panel precarga para que el director vea el diseño antes de editar; si la plantilla usa imagen, un placeholder local `/branding/placeholders/…`).
4. **`palettes.ts`** — si el diseño declara variantes de tono, las registro como opciones controladas con sus hex exactos.

### Requisito de imagen (para el panel admin)

El panel acepta **JPG, PNG, WebP y AVIF** (bucket `media`, ≤10 MB) y el preview
muestra la imagen al instante. El CSS hace que **cualquier imagen se adapte**
(`object-fit`), pero para que se vea nítida y como en el Figma:

- **Regla general:** la resolución mínima de CADA imagen depende de su zona =
  tamaño final renderizado de la zona × 2 (retina). Ej: si la zona de foto mide
  900px de alto en pantalla, sube una imagen de ~1800px de alto.
- **PNG con recorte (sujeto sin fondo):** alto ≥ alto de SU zona × 2.
- **PNG con sobrante transparente:** el `object-fit: cover` recorta o encoge al
  sujeto. Mejor recortar a la silueta antes de subir.
- **Foto de fondo full-bleed:** ancho ≥ ancho de su zona (toda la pantalla) × 2.