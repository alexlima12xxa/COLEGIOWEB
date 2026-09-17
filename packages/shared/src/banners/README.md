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

## 3. Contrato de dos capas (el estándar)

> **El estándar NO se adapta ni se modifica según los banners existentes.
> Los banners —nuevos o recreados— se ajustan al estándar.**
>
> Consecuencia directa: no se añaden excepciones, overrides ni parches para
> acomodar plantillas viejas. Las que no cumplan se recrean.

Toda plantilla se compone de **dos capas**, y la base (`_banner.css`) ya las
define. La plantilla no reimplementa el marco: solo declara su composición.

| Capa | Selector | Responsabilidad | Quién la define |
|---|---|---|---|
| Externa | `.banner` | **Marco rígido**: alto fijo, centrado, recorte de desbordes, fondo base | La base. La plantilla **no la toca** |
| Interna | `.banner__container` | **Contención**: ancho máximo, techo de alto, proporción | La base define las restricciones; la plantilla define el **layout** |

**Por qué:** el marco rígido garantiza que cambiar de slide en el carrusel
**no altere la altura** de la página (sin CLS entre slides).

### 3.1 Capa externa — `.banner` (la provee la base)

| Qué aporta | Valor |
|---|---|
| Alto fijo | `80vh` desktop · `90dvh` mobile (`max-width: 1023px`) |
| Centrado | `display: flex` + `justify-content: center` + `align-items: center` |
| Recorte | `overflow: hidden` (nada desborda ni genera scrollbar) |
| Padding mobile | `var(--banner-padding-mobile, 1.5rem)` |
| Contexto de apilamiento | `position: relative` + `isolation: isolate` (los fondos absolutos de la plantilla dependen de esto) |
| Presupuesto vertical mobile | `--banner-padding-total: calc(var(--banner-padding-mobile, 1.5rem) * 2)` |

La plantilla **solo** añade fondo en `.banner--<slug>`: color, degradado, shapes
decorativas. **No** vuelve a declarar el alto del marco.

### 3.2 Capa interna — `.banner__container` (restricciones de la base)

La base solo impone contención:

- `width: 100%`
- `max-width: var(--banner-container-max, 1600px)`
- `max-height: 100%`
- `aspect-ratio: var(--banner-aspect-ratio, auto)`

En desktop **no** trae `display` / `flex-direction` / `grid-template-columns` /
`gap` / `justify-*`: el motor de layout lo declara cada plantilla.

### 3.3 Contención de media (universal)

La base acota cualquier gráfica dentro del contenedor:

```css
.banner__container :is(img, svg, video) {
  flex-shrink: 1;
  min-height: 0;                            /* permite encoger bajo el tamaño nativo */
  max-height: var(--banner-img-max-height, 30dvh);
  object-fit: contain;
}
```

Ninguna imagen, SVG o video desborda el marco ni fuerza scroll.

### 3.4 Mobile — default de apilado, overrideable

En `max-width: 1023px` la base aplica a `.banner__container`:

```css
max-height: calc(90dvh - var(--banner-padding-total, 3rem));
aspect-ratio: auto;
min-height: 0;

display: flex;
flex-direction: column;
justify-content: space-between;
align-items: center;
gap: var(--banner-gap-mobile, 1rem);
```

Si tu diseño mobile difiere, overrídalo **en tu plantilla** con mayor
especificidad (`.banner--<slug> .banner__container`), nunca con `!important`.

> ⚠️ **Especificidad — leer antes de escribir el CSS de la plantilla.**
> `.banner--<slug> .banner__container` (0,2,0) gana sobre `.banner__container`
> (0,1,0) **también en mobile**. Por eso el layout desktop de la plantilla debe
> declararse dentro de `@media (min-width: 1024px)`: si lo declaras sin media
> query, se filtra al móvil y el default de apilado nunca se aplica. Es
> exactamente el caso de `display` / `flex-direction` (propiedades directas);
> `aspect-ratio` no sufre esto porque la plantilla la declara vía variable y la
> propiedad solo existe en la base.

### 3.5 API de variables del contrato

| Variable | Default | Uso |
|---|---|---|
| `--banner-container-max` | `1600px` | Ancho máximo de la capa interna |
| `--banner-aspect-ratio` | `auto` | Proporción Figma (solo desktop) |
| `--banner-img-max-height` | `30dvh` | Techo de la gráfica en mobile |
| `--banner-gap-mobile` | `1rem` | Separación entre zonas apiladas |
| `--banner-padding-mobile` | `1.5rem` | Padding del marco en mobile |
| `--banner-padding-total` | `calc(padding-mobile * 2)` | Presupuesto vertical restado en mobile |

Se declaran en el bloque de la plantilla (`.banner--<slug>`) y las consume la
base.

### 3.6 Reglas que no se negocian

1. El markup **siempre** envuelve el contenido en `<div class="banner__container">`.
2. La proporción se declara con `--banner-aspect-ratio: W / H`, **nunca** con la
   propiedad `aspect-ratio` directa (rompería el reset mobile de la base).
3. El layout desktop va dentro de `@media (min-width: 1024px)`.
4. `!important` está **prohibido** (convención del proyecto).
5. La plantilla no re-declara el alto del marco ni el padding mobile.
6. La clase raíz es siempre `banner banner--<slug>`.

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
    background-color: var(--banner-bg, #ffffff);
    --banner-aspect-ratio: <W> / <H>;   /* proporción Figma (solo desktop) */
    --banner-img-max-height: 30dvh;     /* opcional */
  }

  /* Desktop: la plantilla declara su motor de layout.
     Siempre dentro de min-width: 1024px (ver 3.4). */
  @media (min-width: 1024px) {
    .banner--<slug> .banner__container {
      display: flex;              /* o grid */
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding-inline: 2rem;
    }
  }

  /* Mobile: solo si difiere del default de apilado de la base */
  @media (max-width: 1023px) {
    .banner--<slug> .banner__container {
      /* override opcional */
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
    --banner-aspect-ratio: 16 / 9;   /* proporción Figma (solo desktop) */
    --banner-img-max-height: 45dvh;
    background-color: var(--banner-bg);
  }

  /* Desktop: motor de layout de la plantilla (siempre en min-width: 1024px) */
  @media (min-width: 1024px) {
    .banner--tarjeta-foto .banner__container {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: stretch;
    }
  }

  .banner__tf-panel {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: var(--space-md, 1rem);
    padding-inline: var(--space-2xl, 3rem);
    background-color: var(--tf-color, #0d3b2e);
    color: var(--tf-texto, #ffffff);
  }

  .banner__tf-panel .banner__title,
  .banner__tf-panel .banner__subtitle {
    color: var(--tf-texto, #ffffff);
  }

  .banner__tf-foto {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--tf-color, #0d3b2e);
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

  /* Mobile: solo lo que difiere del default de apilado de la base */
  @media (max-width: 1023px) {
    .banner--tarjeta-foto .banner__container {
      justify-content: flex-start;
    }

    .banner__tf-foto {
      flex: 0 1 auto;
      height: auto;
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
- **Layout desktop dentro de `@media (min-width: 1024px)`**: fuera de la media
  query se filtra al móvil por especificidad y rompe el apilado.
- **Proporción vía `--banner-aspect-ratio`**, nunca con la propiedad
  `aspect-ratio` directa.
- **Altura del hero: fija en la base** (`80vh` desktop / `90dvh` mobile). La
  plantilla no la declara.
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
- **Zona de imagen**: el contenedor de la foto debe tener `background-color`
  (obligatorio: si el director sube un PNG transparente, se ve el color detrás).

---

## 7. Checklist de verificación

**Contrato (obligatorio):**

- [ ] El markup envuelve el contenido en `<div class="banner__container">`.
- [ ] `.banner--<slug>` declara **solo** fondo + variables (no alto, no padding mobile).
- [ ] El layout desktop está dentro de `@media (min-width: 1024px)`.
- [ ] La proporción se declara con `--banner-aspect-ratio` (no `aspect-ratio` directo).
- [ ] No hay `!important` en el CSS de la plantilla.
- [ ] En mobile el contenido apila o tiene su override explícito.
- [ ] Las gráficas caben en el marco (sin scroll ni desborde).

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
- **Si el layout desktop no se envuelve en `min-width: 1024px`**, gana también
  en mobile por especificidad y el default de apilado no se aplica (ver 3.4).

---

## 9. De Figma a la web (replicar el diseño idéntico)

Para generar el CSS + HTML de una plantilla a partir de un diseño de Figma, usa
el prompt de `figma-prompt.md`. Claves para que el resultado sea fiel:

- **Llena la ficha de especificación** (colores, tipografías px→rem, espaciados,
  comportamiento móvil). El AI NO debe adivinar medidas.
- **La proporción del canvas alimenta `--banner-aspect-ratio`**: mide el frame de
  Figma y declara esa proporción (`W / H`) en la plantilla. Ver los dos modos de
  canvas (full-bleed / contained) en `figma-prompt.md`.
- **Estructura del layout**: la dicta el diseño, no el prompt. El AI reporta las
  zonas que ve en la FICHA LEÍDA (antes del código) para validar la distribución
  (texto/foto en cualquier posición: columnas, fondo full-bleed, superpuesta…).
  Esa distribución es el **motor de layout del `.banner__container`**.
- **Zona de imagen**: el sistema renderiza un `<img>` real. En el CSS de la
  plantilla, estila el contenedor con `position: relative` y el `<img>` con
  `position: absolute; inset: 0; width/height: 100%; object-fit`. Así el tamaño
  de la imagen subida nunca rompe el layout. Puede haber **N zonas** (N campos
  `imagen` del contrato; el panel las sube al instante sin tocar el servidor).
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
5. **Imágenes.** Se aceptan JPG, PNG, WebP y AVIF. Para **PNG transparente**, el
   contenedor de la foto debe tener `background-color` (obligatorio) y el `<img>`
   `object-fit`/`object-position` según el diseño. Recorta a la silueta y exporta
   a ×2 para que se vea nítida.
