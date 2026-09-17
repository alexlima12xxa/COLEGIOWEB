# Plan: Estandarización de banners — contrato de dos capas

> **Creado:** 2026-09-17
> **Proyecto:** WEB-MODELO-1
> **Stack:** Astro SSG (web) + Next.js (admin) + Supabase · monorepo pnpm
> **Riesgo:** MEDIO
> **Estado:** 🟡 Pendiente de ejecución

---

## Objetivo

Estandarizar la **capa externa** (`.banner`) como marco de altura rígida para el carrusel
(sin CLS entre slides) y definir las **reglas de contención** de la **capa interna**
(`.banner__container`) con default de apilado mobile overrideable. Cada plantilla
conserva su propio motor de layout (`flex` o `grid`).

Adicionalmente: eliminar la plantilla obsoleta `prueba` del código y dejar el contrato
**documentado y copiable** para plantillas futuras.

---

## Principio rector

> **El estándar NO se adapta ni se modifica según los banners existentes.
> Los banners —nuevos o recreados— se ajustan al estándar.**

Consecuencia directa: no se añaden excepciones, overrides ni parches para acomodar
plantillas viejas. Las que no cumplan se recrean.

---

## Decisiones tomadas

| Decisión | Valor |
|---|---|
| Migración de contenedores existentes a `.banner__container` | **Opción A** — NO migrar. El contrato aplica a plantillas nuevas |
| Distribución mobile | **Default de apilado** en la base, overrideable por plantilla |
| Mecanismo desktop | `aspect-ratio` vía variable `--banner-aspect-ratio` (cada plantilla su valor) |
| `prueba` | **Se elimina del código** |
| `matricula-banner` | Se mantiene temporalmente; se eliminará y recreará bajo el estándar más adelante |
| Referencia para plantillas futuras | **`README.md`** (fuente única) — NO un `.astro` esqueleto separado |

### Por qué `README.md` y no un `.astro` esqueleto

| Criterio | `README.md` | `.astro` esqueleto |
|---|---|---|
| Riesgo de código muerto | Ninguno | Sí (componente nunca importado) |
| Se mantiene al día | Es la guía de referencia ya existente | Tiende a divergir del contrato |
| Descubribilidad | Es el punto de entrada documentado | Requiere saber que existe |
| Incluye markup + CSS + checklist | Sí, en un solo lugar | Solo markup |
| Verificable por build | No | Sí |

→ **`README.md`**: el proyecto no tiene generador de plantillas, y ya existe este README como
guía canónica. El esqueleto va dentro como bloque copiable (Astro + CSS).

---

## Hallazgos relevantes

1. **`.banner__container` no existe hoy en ninguna plantilla.** `prueba` no tiene contenedor
   (contenido directo en `.banner`); `matricula-banner` usa `.banner__matricula-banner-container`.
   → El contrato solo aplica a plantillas nuevas (coherente con Opción A).
2. **`_banner.css` se exporta como `base.css`** (`packages/shared/package.json` línea 8).
3. **`!important` innecesario**: si las plantillas declaran su proporción vía variable
   (`--banner-aspect-ratio`) y no vía la propiedad directa, la regla mobile de la base
   gana por orden de origen. Alineado con la convención de `PROJECT.md` (*"Prohibido: `!important`"*).
4. **`position: relative` e `isolation: isolate`** deben conservarse en `.banner` (los fondos
   absolutos de plantillas dependen de ellos).
5. **`prueba` tiene 8 puntos de impacto**: 6 archivos de código, el fallback del hero y la
   instancia en BD. Detalle en Fase 2.
6. **`nino-birrete.avif` existe** en `apps/web/public/branding/placeholders/` → el fallback
   puede reapuntar a `matricula-banner` sin assets nuevos.
7. **El `README.md` actual documenta la arquitectura VIEJA** (alturas por plantilla,
   `min-height: 90dvh` en cada `.banner--<slug>`, ejemplo con `display: grid` en la raíz).
   Debe reescribirse para reflejar el contrato de dos capas.

---

## Fase 1 — Contrato universal en `_banner.css`

**Archivo:** `packages/shared/src/banners/css/_banner.css`

### 1.1 Capa externa (`.banner`)

```css
.banner {
  position: relative;              /* requerido por fondos absolutos de plantillas */
  isolation: isolate;              /* contexto de apilamiento propio */
  width: 100%;
  height: 80vh;
  min-height: 80vh;
  display: flex;                   /* estandarizado: centra el contenedor único */
  justify-content: center;
  align-items: center;
  overflow: hidden;                /* bloquea desbordes y scrollbars */
  background-color: var(--color-surface-inverse, #1e1e2e);

  /* Total vertical de padding mobile, derivado (evita desincronización) */
  --banner-padding-total: calc(var(--banner-padding-mobile, 1.5rem) * 2);
}
```

### 1.2 Capa interna (`.banner__container`) — solo restricciones

```css
.banner__container {
  width: 100%;
  max-width: var(--banner-container-max, 1600px);
  max-height: 100%;
  aspect-ratio: var(--banner-aspect-ratio, auto);
  /* SIN display / flex-direction / grid-template-columns / gap / justify */
}
```

### 1.3 Contención de media (universal)

```css
.banner__container :is(img, svg, video) {
  flex-shrink: 1;
  min-height: 0;                            /* permite encoger bajo el tamaño nativo */
  max-height: var(--banner-img-max-height, 30dvh);
  object-fit: contain;
}
```

### 1.4 Mobile / Tablet (`max-width: 1023px`)

```css
@media (max-width: 1023px) {
  .banner {
    height: 90dvh;                 /* congelado: no crece con el contenido */
    min-height: 90dvh;
    padding: var(--banner-padding-mobile, 1.5rem);
  }

  .banner__container {
    max-height: calc(90dvh - var(--banner-padding-total, 3rem));
    aspect-ratio: auto;            /* sin !important: gana por orden de origen */
    min-height: 0;

    /* Default de apilado — overrideable por plantilla (mayor especificidad) */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    gap: var(--banner-gap-mobile, 1rem);
  }
}
```

### API de variables del contrato

| Variable | Default | Uso |
|---|---|---|
| `--banner-container-max` | `1600px` | Ancho máximo de la capa interna |
| `--banner-aspect-ratio` | `auto` | Proporción Figma (solo desktop) |
| `--banner-img-max-height` | `30dvh` | Techo de la gráfica en mobile |
| `--banner-gap-mobile` | `1rem` | Separación entre zonas apiladas |
| `--banner-padding-mobile` | `1.5rem` | Padding del marco en mobile |
| `--banner-padding-total` | `calc(padding-mobile * 2)` | Presupuesto vertical restado en mobile |

> **Regla para plantillas:** declarar la proporción con `--banner-aspect-ratio: W / H`,
> **nunca** con la propiedad `aspect-ratio` directa (rompería el reset mobile sin `!important`).

---

## Fase 2 — Eliminar la plantilla `prueba`

| # | Archivo | Acción |
|---|---|---|
| 2.1 | `packages/shared/src/banners/css/prueba.css` | Eliminar |
| 2.2 | `apps/web/src/features/home/components/HomeBanner/templates/BannerPrueba.astro` | Eliminar |
| 2.3 | `packages/shared/src/banners/catalogo.ts` | Quitar entrada `prueba`; `BANNERS_SLUGS = ["matricula-banner"]`; quitar import de `palettes` |
| 2.4 | `packages/shared/src/banners/palettes.ts` | Eliminar (queda muerto) + quitar su export en `banners/index.ts` |
| 2.5 | `packages/shared/package.json` | Quitar export `"./banners/css/prueba.css"` |
| 2.6 | `apps/web/.../HomeBanner/HomeBanner.astro` | Quitar import y entrada `prueba` de `COMPONENTES` |
| 2.7 | `apps/web/src/data/fallback/banners.json` | Reapuntar a `matricula-banner` (usar `nino-birrete.avif`) o quitar el item |
| 2.8 | Supabase (BD) | Eliminar la instancia del banner `prueba` (manual, vía admin) |

> **`catalogo.test.ts` no requiere cambios**: los tests iteran `BANNERS_SLUGS`, por lo que
> siguen pasando con una sola plantilla.

---

## Fase 3 — Documentación canónica del contrato

### 3.1 Reescribir `packages/shared/src/banners/README.md`

El README es la **fuente única** del contrato. Debe reemplazar la arquitectura vieja
(alturas por plantilla) por la nueva.

**Secciones a cambiar:**

| Sección actual | Cambio |
|---|---|
| §2 Arquitectura (tabla de piezas) | Añadir `.banner__container` como pieza obligatoria del markup |
| §3 Paso 3 — Crear el CSS (ejemplo) | Reemplazar el ejemplo con `min-height: 90dvh` en la raíz por el contrato de dos capas |
| §3 Paso 4 — Crear el `.astro` (ejemplo) | Envolver el contenido en `<div class="banner__container">` |
| §4 Convenciones — "Hero: `min-height: 90dvh`" | Sustituir por la regla de la capa externa (80vh / 90dvh fijos, definidos en la base) |
| Nueva sección | **Contrato de dos capas** + API de variables + regla de override |
| Nueva sección | **Esqueleto copiable** (Astro + CSS) conforme al estándar |

**Esqueleto canónico a documentar (markup):**

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

**Esqueleto canónico a documentar (CSS):**

```css
@layer components {
  .banner--<slug> {
    /* SOLO fondo: color, degradado, shapes decorativas */
    background-color: var(--banner-bg, #ffffff);
    --banner-aspect-ratio: <W> / <H>;   /* proporción Figma (solo desktop) */
    --banner-img-max-height: 30dvh;     /* opcional */
  }

  /* Desktop: la plantilla declara su motor de layout */
  .banner--<slug> .banner__container {
    display: flex;              /* o grid */
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding-inline: 2rem;
  }

  /* Mobile: solo si difiere del default de apilado de la base */
  @media (max-width: 1023px) {
    .banner--<slug> .banner__container {
      /* override opcional */
    }
  }
}
```

### 3.2 Actualizar `packages/shared/src/banners/figma-prompt.md`

- Documentar los **dos modos de canvas** (full-bleed / contained)
- Indicar que la proporción del canvas alimenta `--banner-aspect-ratio`

---

## Fase 4 — Verificación

- [ ] `pnpm --filter @web-modelo/shared test`
- [ ] `pnpm --filter @web-modelo/web check`
- [ ] `pnpm --filter @web-modelo/web build`
- [ ] `pnpm --filter @web-modelo/admin build`
- [ ] El admin ya no ofrece `prueba` como plantilla
- [ ] Hero en dev/local: el fallback carga sin error
- [ ] `matricula-banner` sigue renderizando (no se adapta el estándar; se recreará más adelante)
- [ ] Carrusel: cambiar slides no altera la altura del marco
- [ ] El README ya no contiene la regla vieja de `min-height: 90dvh` por plantilla

---

## Trade-offs

| Ventaja | Costo |
|---|---|
| Marco predecible → sin CLS entre slides | El contrato queda **sin consumidor** hasta que exista una plantilla nueva |
| Plantillas futuras declaran solo su composición | Cada plantilla debe declarar su layout mobile (o aceptar el default) |
| Estándar único, sin excepciones ni deuda | `matricula-banner` queda temporalmente fuera del contrato |
| Sin `!important` | Requiere disciplina: usar la variable, no la propiedad |
| Esqueleto en README (sin código muerto) | No está verificado por el build |

## Riesgos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| El contrato no se puede validar visualmente (ninguna plantilla lo usa) | Media | Validar con `refuerzo-1` (plan aparte) |
| Eliminar `prueba` rompe el fallback del hero | Media | Paso 2.7 obligatorio |
| `matricula-banner` hereda el nuevo marco (padding mobile) sin estar alineado | Baja | Aceptado por diseño: se recreará bajo el estándar |
| Plantilla futura usa `aspect-ratio` directo → rompe mobile | Media | Documentar la regla (Fase 3) |
| Plantilla futura omite `<div class="banner__container">` | Media | Documentar el markup obligatorio + checklist en README |
| Valores crudos (`80vh`, `90dvh`, `1.5rem`) | Baja | Práctica aceptada en `banners/css/` (compartido web/admin) |

## Fuera de alcance

- **Celular horizontal** (`max-height: 600px`): caso degradado, requiere decisión aparte
- **Admin preview proporcional** (`anchoFigma`/`altoFigma`): pertenece al otro documento
- **Implementación de `refuerzo-1`**: Fase 2 del otro documento
- **Alineación/eliminación de `matricula-banner`**: se hará más adelante
- **Migración de contenedores existentes a `.banner__container`**: descartada (Opción A)

---

## Checklist de commits atómicos

- [ ] `refactor(banners): estandarizar capa externa e interna en _banner.css`
- [ ] `refactor(banners): eliminar plantilla prueba y sus dependencias`
- [ ] `docs(banners): reescribir README con contrato de dos capas y esqueleto canónico`

---

```
─────────────────────────────────────────
MANIFIESTO DEL PLAN
─────────────────────────────────────────
Proyecto  : WEB-MODELO-1
Objetivo  : Estandarizar marco rígido de banners + contención de capa interna
Alcance   : 4 fases · 3 commits estimados
Archivos  : _banner.css · catalogo.ts · palettes.ts · package.json ·
            HomeBanner.astro · banners.json · prueba.css · BannerPrueba.astro ·
            README.md · figma-prompt.md
Riesgo    : MEDIO
Bloqueos  : ninguno
Skills    : astro · tailwind-design-system · accessibility
─────────────────────────────────────────
```
