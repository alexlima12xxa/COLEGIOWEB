# Guía: crear e implementar plantillas de banner

Documento de referencia para agregar plantillas de banner nuevas al sistema
híbrido (web Astro + panel admin Next.js). El objetivo es que "agregar una
plantilla" sea un proceso predecible y sin duplicación de slugs.

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

| Archivo | Rol | ¿Tocar al agregar plantilla? |
|---------|-----|------------------------------|
| `catalogo.ts` | slug + contrato (fuente de verdad) | **Sí** |
| `palettes.ts` | colores controlados + helpers `tonoXPorKey` | Sí (si usa tonos) |
| `css/<slug>.css` | estilo de la plantilla | **Sí** (crear) |
| `css/_banner.css` | base compartida de todas | No (infraestructura) |
| `apps/web/.../templates/Banner<X>.astro` | template de render | **Sí** (crear) |
| `apps/web/.../HomeBanner.astro` | despachador `COMPONENTES` | **Sí** (registrar) |
| `apps/web/.../schema.ts` | `z.enum(BANNERS_SLUGS)` | No (automático) |
| `apps/admin/.../actions.ts` | `PLANTILLAS = BANNERS_SLUGS` | No (automático) |
| `packages/shared/package.json` | exports | No (se usa el nombre real) |

---

## 3. Guía paso a paso (con ejemplo completo)

Vamos a crear una plantilla nueva de ejemplo: **"Tarjeta con foto y CTA"**
(`slug: "tarjeta-foto"`).

### Paso 1 — Definir la paleta de colores

Archivo: `palettes.ts`

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

### Paso 2 — Agregar el slug y el contrato al catálogo

Archivo: `catalogo.ts`

```ts
import { TARJETA_FOTO_TONOS } from "./palettes";

export const BANNERS_SLUGS = ["prueba", "tarjeta-foto"] as const;

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
}
```

### Paso 3 — Crear el CSS

Archivo: `css/tarjeta-foto.css` — **el nombre del archivo == slug** (sin alias
en `package.json`).

```css
@layer components {
  .banner--tarjeta-foto {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    min-height: 90dvh;
    height: 90dvh;
    padding: 0;
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
  }

  .banner__tf-foto img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  @media (max-width: 48rem) {
    .banner--tarjeta-foto {
      grid-template-columns: 1fr;
      height: auto;
    }
    .banner__tf-foto {
      height: 240px;
    }
  }
}
```

### Paso 4 — Crear el template `.astro`

Archivo: `apps/web/src/features/home/components/HomeBanner/templates/BannerTarjetaFoto.astro`

```astro
---
import type { Banner } from "../../../../../shared/db/schema";
import ResponsiveImage from "../../../../../shared/ui/ResponsiveImage/ResponsiveImage.astro";
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
---

<article class="banner banner--tarjeta-foto">
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
    {
      datos.background ? (
        <ResponsiveImage
          src={datos.background}
          alt={datos.imageAlt || ""}
          width={1280}
          height={720}
          sizes="50vw"
        />
      ) : (
        <div class="banner__tf-foto" />
      )
    }
  </div>
</article>
```

### Paso 5 — Registrar en el despachador

Archivo: `apps/web/src/features/home/components/HomeBanner/HomeBanner.astro`

```astro
import BannerTarjetaFoto from "./templates/BannerTarjetaFoto.astro";

const COMPONENTES = {
  prueba: BannerPrueba,
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

## 4. Convenciones

- **Nombre del CSS == slug** (`tarjeta-foto.css`). No se agrega alias en
  `package.json`; el import usa la ruta real `@web-modelo/shared/banners/css/<slug>.css`.
- **CSS dentro de `@layer components`**.
- **Tokens con fallback** (`var(--espacio, 1rem)`) para que el preview funcione
  en el admin, que no importa los tokens globales de la web.
- **Colores controlados vía paleta**: el director elige entre opciones
  predefinidas; nunca color libre.
- **Hero**: `min-height: 90dvh` (90vh en pantallas ≥ 64rem).
- Clase raíz siempre `banner banner--<slug>` para heredar la base compartida.

---

## 5. Checklist de verificación

- [ ] Paleta definida + helper `tonoXPorKey`.
- [ ] Slug agregado a `BANNERS_SLUGS` + entrada en `CATALOGO_BANNERS`.
- [ ] `css/<slug>.css` creado (nombre == slug).
- [ ] `templates/Banner<X>.astro` creado e importando base.css + su CSS.
- [ ] Registrado en `COMPONENTES` de `HomeBanner.astro`.
- [ ] `pnpm --filter @web-modelo/shared test` pasa.
- [ ] `web check` / `web build` / `admin build` pasan.
- [ ] En admin: selector muestra la plantilla, campos del contrato visibles, preview OK.

---

## 6. Problemas comunes (para no repetirlos)

- **No hardcodear `plantilla_id`** en `banners-grid.tsx`; usar `BANNERS_SLUGS[0]`
  como default del "nuevo banner".
- **Preview en localhost**: `NEXT_PUBLIC_WEB_URL` del admin debe apuntar a la web
  local (ej. `http://localhost:4321`) y hay que **reiniciar el dev server de la
  web** para que lea el env (`PREVIEW_SIGNING_KEY` via `import.meta.env`).
- **El grid del admin solo lista banners guardados** en Supabase. Una plantilla
  nueva por sí sola no genera tarjeta hasta que creas un banner.
- **No duplicar slugs**: `schema.ts` y `actions.ts` derivan de `BANNERS_SLUGS`;
  editar la lista a mano en esos archivos rompe la fuente de verdad única.
