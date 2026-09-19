# Guía: crear e implementar plantillas de banner

Documento de referencia para agregar plantillas de banner nuevas al sistema
híbrido (web Astro + panel admin Next.js). El objetivo es que "agregar una
plantilla" sea un proceso predecible y sin duplicación de slugs.

> **Este README es la fuente única del contrato de banners.** Si algo de aquí no
> coincide con el código, gana el contrato: los banners se ajustan al estándar,
> no al revés.

---

## 1. Conceptos clave

- **Plantilla**: el diseño + el contrato de campos editables. Es **código**
  (un `.astro`, su CSS y su entrada en el catálogo).
- **Banner**: una **instancia de datos** (fila en la tabla `banners` de
  Supabase) que usa una plantilla. Puede haber muchos banners con la misma
  plantilla.

El registro único es `CATALOGO_BANNERS` en `catalogo.ts`. De él se derivan:

- `BANNERS_SLUGS` → el `z.enum` de la web y el `PLANTILLAS` del admin.
- El formulario del panel (campos dinámicos por contrato).

> Regla de oro: **el slug de una plantilla se define UNA sola vez, en
> `catalogo.ts`.** Nunca lo dupliques como string literal en otro archivo.

---

## 2. Arquitectura — dónde vive cada pieza

| Archivo / pieza | Rol | ¿Tocar al agregar plantilla? |
|---------|-----|------------------------------|
| `catalogo.ts` | slug + contrato + **ejemplo** (fuente de verdad) | **Sí** |
| `css/<slug>.css` | composición de la plantilla (fondo + layout) | **Sí** (crear) |
| `css/_banner.css` | base compartida: implementa el **contrato de dos capas** | No (infraestructura) |
| `<div class="banner__container">` | **capa interna obligatoria** del markup de toda plantilla | **Sí** (siempre) |
| `apps/web/.../templates/Banner<X>.astro` | template de render | **Sí** (crear) |
| `apps/web/.../HomeBanner.astro` | despachador `COMPONENTES` | **Sí** (registrar) |
| `apps/web/.../schema.ts` | `z.enum(BANNERS_SLUGS)` | No (automático) |
| `apps/admin/.../actions.ts` | `PLANTILLAS = BANNERS_SLUGS` | No (automático) |
| `packages/shared/package.json` | entrada en `exports` para el CSS nuevo | **Sí** (nombre real, sin alias) |

> **`palettes.ts` ya no existe.** Contenía únicamente los tonos de la plantilla
> `prueba`, eliminada junto con ella. Si tu plantilla necesita variantes de
> color, crea su propio archivo de tonos (p. ej. `<slug>-tonos.ts` junto a
> `catalogo.ts`), expórtalo desde `index.ts` y declara en el contrato solo
> **opciones controladas**: el director elige entre opciones predefinidas,
> nunca color libre.

> **El import del CSS usa la ruta real del archivo**
> (`@web-modelo/shared/banners/css/<slug>.css`) y esa ruta debe existir como
> entrada en el `exports` de `packages/shared/package.json`. El único alias
> existente es `base.css` → `_banner.css`.

---

## 3. Contrato de dos capas (Arquitectura A · canvas escalado)

> **El estándar NO se adapta ni se modifica según los banners existentes.
> Los banners —nuevos o recreados— se ajustan al estándar.**
>
> Consecuencia directa: no se añaden excepciones, overrides ni parches para
> acomodar plantillas viejas. Las que no cumplan se recrean.

Toda plantilla se compone de **dos capas** y un **canvas**:

| Capa | Selector | Responsabilidad | Quién la define |
|---|---|---|---|
| Externa | `.banner` | **Marco**: full-bleed, centrado, recorte, fondo | La base. La plantilla **no la toca** |
| Interna | `.banner__container` | **Canvas**: ancho máximo + proporción + `container-type` | La base (ratio vía variables) |
| — | interior | **Composición**: coordenadas en `cqw` | La plantilla |

**Por qué:** el marco toma su alto del canvas (`height: auto`), así el banner es
siempre proporcional al diseño y cambiar de slide **no altera la altura** (sin
CLS) porque todas las plantillas comparten el mismo canvas.

### 3.1 Capa externa — `.banner` (la provee la base)

| Qué aporta | Valor |
|---|---|
| Alto | **`auto`** → lo dicta el canvas (Frame 2) |
| Ancho | `100%` (full-bleed) |
| Centrado | `display: flex` + `justify-content: center` + `align-items: center` |
| Recorte | `overflow: hidden` |
| Contexto de apilamiento | `position: relative` + `isolation: isolate` |

La plantilla **solo** añade fondo en `.banner--<slug>`: color, degradado, shapes.
**No** declara alto ni padding.

### 3.2 Capa interna — `.banner__container` (el canvas)

La base impone:

- `width: 100%`
- `max-width: var(--banner-container-max, 1600px)`
- `aspect-ratio: var(--banner-canvas-w, 1600) / var(--banner-canvas-h, 720)`
- `container-type: inline-size` (habilita `cqw`)
- `overflow: hidden`

**Sin `max-height`** (recortaría el canvas y rompería el ratio).

### 3.3 Sistema de coordenadas (`cqw`)

`1cqw = anchoContenedor / 100`. A 1600px → **1cqw = 16px**. Conversión:

```text
px de Figma → cqw = px / 16
```

Todas las medidas interiores (posiciones, tamaños, tipografía, `line-height`,
gaps, radios) se expresan en `cqw`. El canvas escala uniforme.

### 3.4 Zonas de imagen

**Sin reglas globales de media.** Cada zona es una caja con coordenadas de Figma
en `cqw`:

- La caja: `position: absolute; top/left/width/height` (+ `rotate` si aplica).
- La imagen: `position: absolute; inset: 0; width/height: 100%; object-fit`.
  - `cover` para fotos rectangulares; `contain` para cutouts/PNG con alfa o
    cuando el asset trae el marco integrado.
- **Prohibido** `background-color`, `border` o `drop-shadow` en la caja de la
  foto. Si el diseño pide sombra, va sobre la **imagen** (`filter: drop-shadow`),
  no sobre la caja.
- Si hay un **marco** especial (festoneado, irregular), es una **capa overlay**
  SVG/PNG encima de la foto (z-index mayor), con la misma caja.

### 3.5 Mobile — canvas propio

En `max-width: 599px` el canvas cambia a **800×1280** (portrait) vía
`--banner-canvas-mobile-w/h`, con `min-height: var(--banner-min-height-mobile, 0)`.
De 600px en adelante se usa el canvas desktop escalado.

La composición móvil (apilada) la declara la plantilla en su propio
`@media (max-width: 599px)`.

### 3.6 API de variables del contrato

| Variable | Default | Uso |
|---|---|---|
| `--banner-canvas-w` | `1600` | Ancho del canvas desktop (numérico, sin unidad) |
| `--banner-canvas-h` | `720` | Alto del canvas desktop (numérico, sin unidad) |
| `--banner-canvas-mobile-w` | `800` | Ancho del canvas móvil |
| `--banner-canvas-mobile-h` | `1280` | Alto del canvas móvil |
| `--banner-min-height-mobile` | `0` | Piso de alto del canvas en móvil |
| `--banner-container-max` | `1600px` | Ancho máximo del canvas |
| `--banner-content-max-h` | `none` | Techo del bloque de contenido (en `cqw`) |
| `--banner-title-lineas` | `2` | `line-clamp` del título |
| `--banner-subtitle-lineas` | `3` | `line-clamp` del subtítulo |

Se declaran en `.banner--<slug>` (o en la base como default) y las consume la
base.

### 3.7 Reglas que no se negocian

1. El markup **siempre** envuelve el contenido en `<div class="banner__container">`.
2. El ratio se declara con `--banner-canvas-w/h` numéricos; **nunca** con la
   propiedad `aspect-ratio` directa en la plantilla.
3. **Prohibido `max-height` en el canvas.**
4. El interior se expresa en `cqw`; prohibidos `%` vertical, `vh` y
   `line-height: normal`.
5. `!important` está **prohibido** (convención del proyecto).
6. La plantilla no declara el alto del marco ni reglas globales de imagen.
7. La clase raíz es siempre `banner banner--<slug>`.
8. La tipografía vive en la plantilla; la contención, en el motor.

---

## 4. Esqueleto copiable

Punto de partida conforme al contrato. Copia, cambia `<slug>` y borra lo que no
uses.

### Markup (`templates/Banner<X>.astro`)

```astro
<article class="banner banner--<slug>">
  <div class="banner__container">
    <div class="banner__content">
      {datos.kicker && <span class="banner__kicker">{datos.kicker}</span>}
      <h1 class="banner__title">{datos.title}</h1>
      {datos.subtitle && <p class="banner__subtitle">{datos.subtitle}</p>}
      <BannerActions cta={datos.cta} actions={datos.actions} />
    </div>
    <!-- zonas adicionales: gráfica, vectores, etc. -->
  </div>
</article>
```

### CSS (`css/<slug>.css`)

```css
@layer components {
  /* Capa externa: SOLO fondo + variables del contrato */
  .banner--<slug> {
    --banner-bg: #ffffff;
    --banner-canvas-w: 1600;
    --banner-canvas-h: 720;
    background-color: var(--banner-bg);
  }

  .banner--<slug> .banner__container {
    position: relative; /* contexto de posicionamiento del canvas */
  }

  /* Desktop (≥600px): composición en cqw = pxFigma / 16 */
  @media (min-width: 600px) {
    .banner--<slug> .banner__content--<slug> {
      position: absolute;
      /* left/top/width/height en cqw, según la FICHA */
    }
    .banner--<slug> .banner__title {
      font-size: <n>cqw;
      line-height: <n>cqw; /* SIEMPRE explícito */
    }
  }

  /* Móvil (<600px): composición apilada · canvas 800×1280 · cqw = pxFigma / 8 */
  @media (max-width: 599px) {
    .banner--<slug> .banner__content--<slug> {
      /* apilado centrado */
    }
  }
}
```

---

## 5. Guía paso a paso (con ejemplo completo)

Vamos a crear una plantilla nueva de ejemplo: **"Tarjeta con foto y CTA"**
(`slug: "tarjeta-foto"`).

### Paso 1 — Definir los tonos de la plantilla (opcional)

Si la plantilla ofrece variantes de color, crea su archivo de tonos junto al
catálogo. Archivo: `<slug>-tonos.ts` (recuerda exportarlo en `index.ts`).

```ts
export interface TonoTarjetaFoto {
  key: string;
  label: string;
  color: string;      // color del panel lateral
  texto: string;      // color del texto sobre el panel
}

export const TARJETA_FOTO_TONOS: TonoTarjetaFoto[] = [
  { key: "verde", label: "Verde institucional", color: "#0d3b2e", texto: "#ffffff" },
  { key: "marino", label: "Azul marino", color: "#0b1f3a", texto: "#ffffff" },
];

export function tonoTarjetaFotoPorKey(key: string): TonoTarjetaFoto {
  return TARJETA_FOTO_TONOS.find((t) => t.key === key) ?? TARJETA_FOTO_TONOS[0];
}
```

Si la plantilla no necesita variantes (colores fijos por diseño), sáltate este
paso y declara los hex en su CSS.

### Paso 2 — Agregar el slug y el contrato al catálogo

Archivo: `catalogo.ts`

```ts
import { TARJETA_FOTO_TONOS } from "./tarjeta-foto-tonos";

export const BANNERS_SLUGS = ["matricula-banner", "tarjeta-foto"] as const;

// Dentro de CATALOGO_BANNERS, agregar:
{
  slug: "tarjeta-foto",
  nombre: "Tarjeta con foto y CTA",
  contrato: {
    slug: "tarjeta-foto",
    nombre: "Tarjeta foto",
    campos: [
      { key: "kicker", label: "Etiqueta superior", tipo: "texto", opcional: true, maxLength: 60 },
      { key: "title", label: "Título", tipo: "texto", maxLength: 160 },
      { key: "subtitle", label: "Subtítulo", tipo: "texto-largo", opcional: true, maxLength: 300 },
      {
        key: "tono",
        label: "Color del panel",
        tipo: "opciones",
        default: TARJETA_FOTO_TONOS[0].key,
        opciones: TARJETA_FOTO_TONOS.map((t) => ({ label: t.label, value: t.key })),
      },
      { key: "background", label: "Imagen de la derecha", tipo: "imagen", ayuda: "Al menos 1280×720." },
      { key: "actions", label: "Botones", tipo: "booleano" },
    ],
  },
  // Contenido de muestra: el panel lo precarga al crear un banner para que el
  // director vea el diseño real con textos ANTES de escribir. Si la plantilla
  // usa imagen, incluye un placeholder local para que el preview se vea completo.
  ejemplo: {
    kicker: "ADMISIÓN 2026",
    title: "Formamos líderes para transformar el futuro",
    subtitle: "Una educación integral, cercana y de excelencia.",
    tono: TARJETA_FOTO_TONOS[0].key,
    background: "/branding/placeholders/<tu-placeholder>.jpg",
    cta: { label: "Iniciar admisión", href: "/admisiones", variant: "primary" },
  },
}
```

### Paso 3 — Crear el CSS

Archivo: `css/tarjeta-foto.css` — **el nombre del archivo == slug**. Añade su
entrada en el `exports` de `packages/shared/package.json`:

```json
"./banners/css/tarjeta-foto.css": "./src/banners/css/tarjeta-foto.css"
```

```css
@layer components {
  /* Capa externa: SOLO fondo + variables del contrato */
  .banner--tarjeta-foto {
    --banner-bg: var(--tf-color, #0d3b2e);
    --banner-canvas-w: 1600;
    --banner-canvas-h: 720;
    background-color: var(--banner-bg);
  }

  .banner--tarjeta-foto .banner__container {
    position: relative;
  }

  /* Desktop (≥600px): composición en cqw = pxFigma / 16 */
  @media (min-width: 600px) {
    /* Panel de texto (mitad izquierda) */
    .banner__tf-panel {
      position: absolute;
      left: 0;
      top: 0;
      width: 50cqw;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: 2cqw;
      padding-inline: 4cqw;
      background-color: var(--tf-color, #0d3b2e);
      color: var(--tf-texto, #ffffff);
    }

    .banner__tf-panel .banner__title {
      font-size: 6cqw;
      line-height: 7cqw;
      color: var(--tf-texto, #ffffff);
    }

    .banner__tf-panel .banner__subtitle {
      font-size: 2.5cqw;
      line-height: 3.5cqw;
      color: var(--tf-texto, #ffffff);
    }

    /* Foto (mitad derecha) */
    .banner__tf-foto {
      position: absolute;
      left: 50cqw;
      top: 0;
      width: 50cqw;
      height: 100%;
      overflow: hidden;
    }

    .banner__tf-foto img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
  }

  /* Móvil (<600px): apilado · canvas 800×1280 · cqw = pxFigma / 8 */
  @media (max-width: 599px) {
    .banner__tf-panel {
      position: absolute;
      left: 8cqw;
      top: 8cqw;
      width: 84cqw;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 3cqw;
      color: var(--tf-texto, #ffffff);
    }

    .banner__tf-foto {
      position: absolute;
      left: 10cqw;
      top: 60cqw;
      width: 80cqw;
      height: auto;
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }
  }
}
```

### Paso 4 — Crear el template `.astro`

Archivo: `apps/web/src/features/home/components/HomeBanner/templates/BannerTarjetaFoto.astro`

```astro
---
import type { Banner } from "../../../../../shared/db/schema";
import { resolveAssetUrl } from "../../../../../shared/db/storage";
import BannerActions from "../BannerActions.astro";
import { tonoTarjetaFotoPorKey } from "@web-modelo/shared";
import "@web-modelo/shared/banners/css/base.css";
import "@web-modelo/shared/banners/css/tarjeta-foto.css";

export interface Props {
  banner: Banner;
}

const { banner } = Astro.props;
const { datos } = banner;
const tono = tonoTarjetaFotoPorKey(String(datos.tono ?? ""));
const fotoUrl = datos.background
  ? (resolveAssetUrl(datos.background) ?? datos.background)
  : "";
---

<article class="banner banner--tarjeta-foto">
  <div class="banner__container">
    <div
      class="banner__tf-panel"
      style={{ "--tf-color": tono.color, "--tf-texto": tono.texto }}
    >
      {datos.kicker && <span class="banner__kicker">{datos.kicker}</span>}
      <h1 class="banner__title">{datos.title}</h1>
      {datos.subtitle && <p class="banner__subtitle">{datos.subtitle}</p>}
      <BannerActions cta={datos.cta} actions={datos.actions} />
    </div>

    <div class="banner__tf-foto">
      {fotoUrl && <img src={fotoUrl} alt={datos.imageAlt || ""} loading="eager" decoding="async" />}
    </div>
  </div>
</article>
```

### Paso 5 — Registrar en el despachador

Archivo: `apps/web/src/features/home/components/HomeBanner/HomeBanner.astro`

```astro
import BannerTarjetaFoto from "./templates/BannerTarjetaFoto.astro";

const COMPONENTES = {
  "matricula-banner": BannerMatriculaBanner,
  "tarjeta-foto": BannerTarjetaFoto,
} as const;
```

### Paso 6 — Verificar

Ejecutar:

```
pnpm --filter @web-modelo/shared test
pnpm --filter @web-modelo/web check
pnpm --filter @web-modelo/web build
pnpm --filter @web-modelo/admin build
```

Probar en el admin: el selector muestra "Tarjeta con foto y CTA", sus campos
del contrato aparecen, y el preview (con la web local corriendo) renderiza la
plantilla.

---

## 6. Convenciones

- **Nombre del CSS == slug** (`tarjeta-foto.css`). El import usa la ruta real
  `@web-modelo/shared/banners/css/<slug>.css` y esa entrada debe existir en el
  `exports` de `packages/shared/package.json` (el único alias es `base.css`).
- **CSS dentro de `@layer components`**.
- **Contrato de dos capas**: la capa externa (`.banner`) la provee la base; la
  plantilla solo declara fondo + variables + su motor de layout. Ver §3.
- **Layout desktop dentro de `@media (min-width: 600px)`**; la composición móvil
  va en `@media (max-width: 599px)`. Así no se filtran una a la otra.
- **Canvas vía `--banner-canvas-w/h` numéricos**, nunca con la propiedad
  `aspect-ratio` directa en la plantilla.
- **Alto del hero: lo dicta el canvas** (el marco `.banner` es `height: auto`).
  La plantilla no declara alto.
- **Tokens con fallback** (`var(--espacio, 1rem)`) para que el preview funcione
  en el admin, que no importa los tokens globales de la web.
- **Colores controlados vía opciones del contrato**: el director elige entre
  opciones predefinidas; nunca color libre.
- Clase raíz siempre `banner banner--<slug>` para heredar la base compartida.
- **Contenido de ejemplo (`ejemplo`)**: cada entrada del catálogo declara un
  `datos` válido de muestra. El panel lo precarga al crear un banner para que el
  director vea el diseño real antes de escribir. Si la plantilla usa imagen, el
  ejemplo incluye un **placeholder local** (`/branding/placeholders/…`).
  `catalogo.test.ts` valida que exista y que su `tono` sea una opción válida.
- **Zona de imagen**: caja con coordenadas en `cqw` + `object-fit`
  (`cover`/`contain`). **Sin `background-color`/`shadow` en la caja**; la sombra
  va sobre la `<img>`. El marco especial, como overlay encima. Ver §3.4.

---

## 7. Checklist de verificación

**Contrato (obligatorio):**

- [ ] El markup envuelve el contenido en `<div class="banner__container">`.
- [ ] `.banner--<slug>` declara **solo** fondo + variables (no alto, no padding).
- [ ] El layout desktop está dentro de `@media (min-width: 600px)`.
- [ ] La composición móvil está dentro de `@media (max-width: 599px)`.
- [ ] El ratio se declara con `--banner-canvas-w/h` (no `aspect-ratio` directo).
- [ ] No hay `max-height` en el canvas ni `!important` en la plantilla.
- [ ] Todo el interior usa `cqw` (sin `%` vertical, `vh` ni `line-height: normal`).
- [ ] Las gráficas caben en el canvas (sin scroll ni desborde).

**Registro:**

- [ ] Tonos definidos en el archivo de la plantilla + helper `tonoXPorKey` (si aplica).
- [ ] Slug agregado a `BANNERS_SLUGS` + entrada en `CATALOGO_BANNERS` con `ejemplo` (datos válidos; placeholder local si usa imagen).
- [ ] `css/<slug>.css` creado (nombre == slug) + entrada en `exports` de `packages/shared/package.json`.
- [ ] `templates/Banner<X>.astro` creado e importando base.css + su CSS.
- [ ] Registrado en `COMPONENTES` de `HomeBanner.astro`.
- [ ] `pnpm --filter @web-modelo/shared test` pasa.
- [ ] `web check` / `web build` / `admin build` pasan.
- [ ] En admin: selector muestra la plantilla, campos del contrato visibles, preview OK.

---

## 8. Problemas comunes (para no repetirlos)

- **No hardcodear `plantilla_id`** en `banners-grid.tsx`; usar `BANNERS_SLUGS[0]`
  como default del "nuevo banner".
- **Preview (iframe)**: el admin embebe `/preview-admin` con un token firmado.
  Requiere `NEXT_PUBLIC_WEB_URL` en el admin y `PREVIEW_SIGNING_KEY` idéntico en
  admin y web. En local, `NEXT_PUBLIC_WEB_URL` apunta a la web local (ej.
  `http://localhost:4321`) y hay que **reiniciar el dev server de la web** para
  que lea el env (`PREVIEW_SIGNING_KEY` vía `import.meta.env`).
- **`ADMIN_ORIGIN` (opcional, web)**: si se define, `/preview-admin` emite
  `Content-Security-Policy: frame-ancestors` y solo el origen indicado puede
  embeberlo. Debe ser el origen exacto del admin (con `https://`, sin barra
  final). Si se omite, no se emite el header y el preview funciona igual.
- **Contenido de ejemplo**: al crear un banner el panel precarga `ejemplo`. Si el
  director guarda sin editarlo, se muestra un **aviso ámbar no bloqueante** (sí
  puede guardar). Revisa los textos antes de publicar.
- **El grid del admin solo lista banners guardados** en Supabase. Una plantilla
  nueva por sí sola no genera tarjeta hasta que creas un banner.
- **No duplicar slugs**: `schema.ts` y `actions.ts` derivan de `BANNERS_SLUGS`;
  editar la lista a mano en esos archivos rompe la fuente de verdad única.
- **No se usa `data-banner-field`**: el preview es un iframe que renderiza las
  plantillas `.astro` reales; no hay marcado de zonas ni render compartido.
- **Si el layout desktop no se envuelve en `min-width: 600px`**, sus reglas
  (posiciones absolutas, tamaños) también aplican en móvil y rompen la
  composición apilada. Ver §3.5.

---

## 9. De Figma a la web (replicar el diseño idéntico)

Para generar el CSS + HTML de una plantilla a partir de un diseño de Figma, usa
el prompt de `figma-prompt.md`. Claves para que el resultado sea fiel:

- **Llena la ficha de especificación** (colores, tipografías en px, `line-height`,
  espaciados, cajas, comportamiento móvil). El AI NO debe adivinar medidas.
- **El canvas alimenta `--banner-canvas-w/h`**: mide el frame de Figma y declara
  esa proporción (numérica) en la plantilla. Ver los dos modos de canvas
  (full-bleed / contained) en `figma-prompt.md`.
- **Estructura del layout**: la dicta el diseño, no el prompt. El AI reporta las
  zonas que ve en la FICHA LEÍDA (antes del código) para validar la distribución
  (texto/foto en cualquier posición: columnas, fondo full-bleed, superpuesta…).
  Esa distribución es el **motor de layout del `.banner__container`**.
- **Zona de imagen**: el sistema renderiza un `<img>` real. En el CSS de la
  plantilla, la caja va con coordenadas de Figma en `cqw` y el `<img>` con
  `position: absolute; inset: 0; width/height: 100%; object-fit`. Sin
  `background-color`/`shadow` en la caja (la sombra, sobre la `<img>`). Puede
  haber **N zonas** (N campos `imagen` del contrato; el panel las sube al instante).
- **NO uses `ResponsiveImage` para la foto del banner**: envuelve en `<picture>`
  (astro:assets) y fuerza `height: auto`, lo que rompe la cadena `height: 100%`
  y la imagen no llena el hero. Usa `<img src={resolveAssetUrl(...)}>` directo.
- **Tipografía**: usa `var(--font-display, "Outfit", ...)` para títulos y
  `var(--font-sans, ...)` para el resto (tokens del sitio), no `system-ui` a pelo.
- **Variantes de color**: decláralas en el archivo de tonos de la plantilla como
  opciones controladas (el director elige entre opciones predefinidas), con sus
  hex exactos.
- **Recomendación de imagen**: ver `figma-prompt.md` (resolución ×2 retina y
  recorte a la silueta para PNG transparente).

---

## 10. Flujo de creación y subida de un banner (panel admin)

Resumen de lo que hace el panel hoy:

1. **Crear y ver el diseño.** El director pulsa "Nuevo banner", elige plantilla y
   el panel precarga el `ejemplo` de esa plantilla. El iframe muestra el diseño
   real (con textos e imagen de muestra) desde el primer render, antes de
   escribir nada. Al cambiar de plantilla se recarga con su ejemplo.
2. **Subir imagen.** El campo de tipo `imagen` sube el archivo de inmediato al
   bucket `media` (`banners/temp-…`) y el preview lo muestra al instante. El
   director puede reemplazarla cuantas veces quiera antes de guardar.
3. **Guardar.** Al enviar, `guardarBanner` compone `datos`, conserva los campos
   no editados, procesa `background`/`image` (sube o reutiliza; convierte
   data-URL) y persiste la ruta del bucket. Después dispara el rebuild de la web.
4. **Publicar.** La web resuelve la ruta con `resolveAssetUrl` al construir. El
   preview corre en la web, por eso un placeholder local (`/branding/…`) funciona
   sin Supabase.
5. **Imágenes.** Se aceptan JPG, PNG, WebP y AVIF. Para **PNG/AVIF con alfa**
   (cutout o marco festoneado), la caja es transparente, el `<img>` usa
   `object-fit` según el diseño y la sombra (`drop-shadow`) va sobre la `<img>`.
   Sube a ×2 para que se vea nítida.
