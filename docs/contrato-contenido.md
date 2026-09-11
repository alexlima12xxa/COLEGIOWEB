# Contrato de contenido y datos (web ↔ panel admin)

> Documento de referencia único del contrato de datos entre el panel admin
> (Next.js) y la web pública (Astro, SSG). Actualizado: 2026-09-09.
>
> Complementa `docs/multi-colegio.md` (operación de alta de colegios). Aquí se
> detalla el **qué** (claves, shapes, fallbacks) y el **cómo** (flujo, reglas de
> mantenimiento).

---

## 1. Patrón de 2 capas: config = base · Supabase = override

Todo el contenido editorial de la web sigue el mismo modelo:

```
configs/<slug>.ts ──► siteConfig ──► FALLBACK (base por colegio, en build-time)
Supabase ─────────► contenido (JSONB) / tablas relacionales ──► OVERRIDE (lo que edita el director)
                            │
          getter de la web: │ ¿existe la clave del tenant en BD?
                            ├── No  → fallback (siteConfig o JSON versionado)
                            └── Sí  → el valor de la BD manda (validado con zod)
```

Reglas:

1. **La BD manda** cuando la clave existe y pasa la validación zod del front.
2. **El fallback nunca rompe el build**: si la BD no está configurada, la clave
   no existe o el valor es inválido, se usa `siteConfig` o un JSON versionado de
   `apps/web/src/data/fallback/`.
3. **`siteConfig` es la "marca base" de cada colegio** (código, controlado por
   la agencia). El director **sobreescribe** contenido vía panel, nunca la marca.
4. **Un campo dejado en blanco** en el panel puede completarse con el valor del
   config del colegio (ver `getFooter`), salvo reglas explícitas (p. ej. redes
   sociales vacías = no mostrar iconos).

---

## 2. Flujo end-to-end

```
PANEL ADMIN (Next.js)                 SUPABASE                WEB (Astro, SSG)
------------------------          -----------------          ----------------------
server action                      contenido (JSONB) o
(guardar<Seccion>)                  tablas (banners,
  valida + clamp                    noticias, circulares)
  upsert clave          ─────────►  (tenant_id, clave)
  triggerRebuild()  ─────────► Vercel deploy hook (tenant)
                                     │
                                     ▼  Astro build (service role key)
                                 getter (get<Seccion>)
                                   ├─ ¿clave?  ─No─► fallback siteConfig/JSON
                                   └─ Sí ──► zod.safeParse ─► render
```

- El trigger de rebuild vive en `apps/admin/lib/rebuild.ts` (POST al deploy hook
  de Vercel del tenant, con fallback a `REBUILD_HOOK_URL`).
- La web es SSG: lee Supabase **solo en build-time** con la service role key,
  filtrando por `PUBLIC_TENANT_ID`.

---

## 3. Inventario de claves `contenido` (JSONB por tenant)

> Sembradas por `supabase/seed_contenido.sql` (12 claves del piloto) + nuevas
> claves `footer`/`whatsapp`. README oficial de claves en
> `supabase/migrations/20260901000000_contenido.sql`.

| clave | shape (zod) | fallback | sección admin | getter web |
|---|---|---|---|---|
| `mision` | string | `about.mission` | Nosotros (Textos) | `getMision` |
| `vision` | string | `about.vision` | Nosotros (Textos) | `getVision` |
| `filosofia` | `[{title, description}]` | `about.philosophy` | Nosotros (Textos) | `getFilosofia` |
| `historia` | `[{title, date, description}]` | `about.history` | Nosotros (Textos) | `getHistoria` |
| `nosotros_hero` | `{title, lead, description, image}` | hardcode en `contenido.ts` | Nosotros (Textos) | `getNosotrosHero` |
| `hero` | `{badge?, name, slogan, description, heroPhoto, tourPoster, actions[]?}` | `siteConfig` + placeholders | Portada | `getHero` |
| `navbar` | `{links: [{label, href}]}` | `NAVBAR_FALLBACK` (const) | Portada | `getNavbar` |
| `metricas` | `[{value, label}]` | `home.metrics` | Portada | `getMetricas` |
| `pilares` | `{titulo, items: [{title, description, metric}]}` | `home.pillarsEnAccion` | Portada | `getPilares` |
| `video_tour` | `{videoUrl, poster, title, description}` | placeholder | Video Tour | `getVideoTour` |
| `autoridades` | `[{name, role, image}]` | `about.authorities` | Autoridades | `getAutoridades` |
| `niveles` | `{preescolar, primaria, secundaria, ...}` (por nivel: `{name, ageRange, subtitle, subtitleVisible, enabled, headline, description, image, program[], methodology, schedule, cta, ctaHref}`) | `levels.json` + `siteConfig.levels` (orden/slugs) | Niveles | `getNiveles` / `getNivelesResumen` |
| `admisiones` | `{heroBadge?, heroTitlePre?, heroTitleHighlight?, heroDescription?, fechasClave[], aviso?, etapas[], requisitosPorNivel{}, faq[]}` | `admissions.json` + `siteConfig.admissions` | Admisiones | `getAdmisiones` |
| `galeria` | `[{src, alt, variant}]` | `home.bentoGallery` | Galería | `getGaleria` |
| `contacto` | `{info: {mapUrl?, mapEmbedUrl?}, departments[], formFields[]}` | `contact.json` | Contacto | `getContacto` |
| `whatsapp` | `{numero}` (E.164 `+573101234567`) | `siteConfig.contact.whatsapp` | Contacto | `getWhatsapp` |
| `footer` | ver sección 4 | `siteConfig` (contact/social/levels) | Footer | `getFooter` |

---

## 4. Claves nuevas / modificadas (2026-09)

### `footer` — pie de página (pestaña admin "Footer")

```json
{
  "contact": {
    "address": "Calle 123 # 45-67",
    "city": "Bogotá, Colombia",
    "phone": "+57 601 234 5678",
    "email": "contacto@colegio.edu.co",
    "officeHours": "Lunes a viernes, 7:00 a.m. – 4:00 p.m."
  },
  "contactTitle": "Contacto",
  "levelsTitle": "Niveles educativos",
  "socialTitle": "Síguenos",
  "social": {
    "facebook": "https://facebook.com/micolegio",
    "instagram": "https://instagram.com/micolegio"
  },
  "levels": [
    {
      "name": "Preescolar",
      "slug": "preescolar",
      "links": [{ "label": "Conoce más", "href": "/niveles/preescolar" }]
    }
  ]
}
```

Reglas:

- **`contact`** = datos generales de contacto. Alimenta **Footer, página de
  Contacto, SEO (JSON-LD) y Aviso de privacidad**. Si un campo se deja en blanco,
  la web lo completa con `siteConfig.contact`.
- **`social`** = redes sociales. Solo se guardan las **no vacías**; si todas
  quedan vacías, no se muestran iconos (la BD manda, no cae al config).
- **`levels`** = bloques del footer, **INDEPENDIENTES** de la clave `niveles`.
  Renombrar aquí un nivel **no afecta** a las tarjetas del inicio (que leen
  `niveles`). Cada enlace se valida contra `PAGINAS_FOOTER` (rutas existentes).
- **Títulos** (`contactTitle`, `levelsTitle`, `socialTitle`) editables.
- Fallback: construido desde `siteConfig` por colegio (no desde un JSON estático).

### `contacto` — página de contacto (pestaña admin "Contacto")

```json
{
  "info": {
    "mapUrl": "https://maps.google.com/?q=...",
    "mapEmbedUrl": "https://www.google.com/maps/embed?pb=..."
  },
  "departments": [
    {
      "name": "Recepción general",
      "phone": "+57 601 234 5678",
      "email": "recepcion@colegio.edu.co",
      "hours": "Lunes a viernes, 7:00 a.m. – 4:00 p.m.",
      "hidden": false
    }
  ],
  "formFields": [
    { "id": "name", "label": "Nombre completo", "type": "text", "required": true }
  ]
}
```

- **`info`** solo guarda las URLs del mapa. La dirección/ciudad/teléfono/email/
  horario **viven en `footer.contact`** (editable en la pestaña "Footer").
- **`departments`** alimenta el directorio; **`formFields`** genera el formulario
  (estáticos en el fallback `contact.json`, no editables en panel).

### `whatsapp` — número global

```json
{ "numero": "+573101234567" }
```

- Formato E.164 (validado con regex en el server action). Consumido por la página
  de Admisiones (`getWhatsapp`) con fallback a `siteConfig.contact.whatsapp`.

---

## 5. Tablas relacionales (no JSONB)

| Tabla | Contenido | Sección admin | Getter web | Notas |
|---|---|---|---|---|
| `banners` | Banner por fila (`plantilla_id`, `orden`, `activo`, `datos`) | Banners | `getBanners` (`db/banners.ts`) | Fallback `banners.json` |
| `noticias` | Entradas de noticias | Noticias | `getNoticias` (`db/content.ts`) | RLS por tenant |
| `circulares` | Circulares | Circulares | `getCirculares` (`db/content.ts`) | RLS por tenant |
| `leads` | Solicitudes del formulario (web → BD) | Leads (solo lectura/export) | — | Escritura vía anon key en el front |

---

## 6. Elementos SOLO del config (no editables en panel)

| Área | Campos | Dónde |
|---|---|---|
| **Branding** | logo, logoInverse, colores, fuentes, radios, favicon, og-image, placeholders | `siteConfig.branding` |
| **Identidad** | nombre del colegio, slogan, descripciones, fundación | `siteConfig.identity` |
| **SEO** | siteUrl, título por defecto, keywords, author, twitterHandle | `siteConfig.seo` |
| **Estructura de niveles** | orden canónico y slugs (el contenido se edita en "Niveles") | `siteConfig.levels` |
| **Admisiones (global)** | periodLabel, ctaLabel, ctaUrl, deadline (se mezcla con clave `admisiones`) | `siteConfig.admissions` |
| **WhatsApp base** | número por defecto (override con clave `whatsapp`) | `siteConfig.contact.whatsapp` |
| **Supabase** | URL, keys, tenantId del colegio | `siteConfig.supabase` |

> La marca la controla la agencia en código (`configs/<slug>.ts` +
> `public/branding/<slug>/`); el director edita solo **contenido** vía panel.

---

## 7. Multi-colegio

- Cada tenant tiene su fila en `contenido` (`tenant_id` + `clave`). `getContenido`
  lee la del tenant activo (`PUBLIC_TENANT_ID`).
- Un colegio que **no edita** una sección ve **su propio** `siteConfig` (fallback).
- Al **guardar por primera vez** una sección, se crea la fila de ese colegio y
  desde entonces **la BD manda**.
- Los assets de imagen se resuelven con `resolveAssetUrl`/`ensureAccessibleImage`
  (Supabase Storage); si el asset no es accesible, se usa un placeholder local y
  el build no se rompe.

---

## 8. Imágenes: formato de subida y optimización

- **Qué subir**: JPG o PNG, **≤ 2 MB** por archivo. El panel admin guarda el
  original en Supabase Storage (bucket `media`); no se recomienda subir AVIF/WebP
  manualmente porque el build los regenera.
- **Qué hace el build**: las imágenes de Storage se optimizan en build-time vía
  `astro:assets` → AVIF + WebP con `srcset` responsivo (`widths=[480,768,1200]`).
  El JPEG/PNG original queda como fallback.
- **Assets de marca** (`logo`, `favicon`, `og-image`, placeholders): viven en
  `public/branding/` y **no** pasan por `astro:assets`; se sirven tal cual. Los
  placeholders pesados se reducen con `pnpm --filter @web-modelo/web optimize:images`.
- **Validación de accesibilidad**: en build-time se hace `HEAD` a cada imagen de
  Storage; si no responde 2xx, se sustituye por un placeholder local (el build no
  se rompe).
- **Pendiente (fase 2 panel admin)**: validar MIME y tamaño en la edge function de
  subida (rechazar > 2 MB o tipos no-imagen antes de escribir en Storage).

---

## 9. Checklist de mantenimiento (agregar una clave nueva)

Para añadir una sección editable nueva, seguir SIEMPRE este orden:

1. **Schema zod** → `apps/web/src/shared/db/schema.ts` (shape que la web espera).
2. **Fallback** → JSON versionado en `apps/web/src/data/fallback/` **o** construido
   desde `siteConfig` (si son datos por colegio). Incrementar `version` del JSON
   si aplica.
3. **Getter** → `apps/web/src/shared/db/contenido.ts` (`getContenido<...>(clave,
   fallback)` + `safeParse`). Si es tabla relacional, crear en `db/<tabla>.ts`.
4. **Server action** → `apps/admin/app/admin/<seccion>/actions.ts`
   (`requireAdmin()` → validar → `upsert(tenant_id, clave, valor)` →
   `triggerRebuild()` → `revalidatePath()`).
5. **Consumidor web** → página/componente Astro llama al getter en frontmatter y
   pasa datos resueltos a componentes presentacionales.
6. **Documentar** → actualizar la tabla de la sección 3 de este documento **y** el
   README de claves de `supabase/migrations/20260901000000_contenido.sql`.
7. **Opcional** → sembrar en `supabase/seed_contenido.sql` si el colegio nuevo
   debe arrancar con contenido predefinido.

Regla de oro: una clave que se edita en el panel **debe** mantener el MISMO shape
que consume la web (zod). Si cambia el shape, se actualizan en paralelo: schema,
fallback, server action y este documento.