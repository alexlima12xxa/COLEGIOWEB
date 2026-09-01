# GATE 3 — Páginas públicas (Home, Nosotros, Niveles, Admisiones, Contacto)

> **Creado:** 2026-08-28 17:47
> **Proyecto:** WEB-MODELO-1 (Colegio Piloto)
> **Stack:** Astro 7.2.9 (SSG) · Tailwind CSS v4 · TypeScript strict · pnpm
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** [✓] COMPLETADO

---

## Objetivo

Implementar las 5 páginas públicas del sitio institucional con mobile-first estricto
(`grid-cols-1` default, escalado con `sm:`/`md:`), cumpliendo el GATE 3:
Lighthouse móvil ≥ 95 en todas las páginas y cero scroll horizontal en 320/375/768/1440px.

---

## Alcance ejecutado

### 1. Home `/`

- Hero con video tour (VideoModal reutilizado) + foto del colegio (ResponsiveImage eager + preload).
- Strip de confianza con 4 métricas (grid 1 → 2 → 4 columnas).
- 3 tarjetas de niveles (desde `site.config.ts`).
- 4 diferenciadores numerados.
- Galería bento con 6 fotos (variantes large/tall/wide/default).
- CTA final inverso.

### 2. Nosotros `/nosotros`

- Historia con timeline de 5 hitos (componente Timeline).
- Misión / Visión (tarjetas, una inversa).
- Filosofía institucional (3 principios).
- Autoridades con fotos 4:5 desde `/branding/placeholders/`.
- CTA admisiones.

### 3. Niveles `/niveles` + `/niveles/[slug]`

- Índice `/niveles` con tarjetas de todos los niveles habilitados.
- `NivelLayout` compartido (hero, plan de estudios, metodología, horarios, CTA) con datos del config + contenido específico por nivel en `src/data/fallback/levels.json`.
- Rutas estáticas: preescolar, primaria, secundaria, media-tecnica.

### 4. Admisiones `/admisiones`

- Cronograma con timeline (4 etapas).
- Requisitos (lista con marcadores).
- FAQ acordeón (componente Accordion accesible) + JSON-LD `FAQPage`.
- CTA con WhatsApp.

### 5. Contacto `/contacto`

- Directorio por departamento con enlaces `tel:` y `mailto:`.
- Formulario placeholder (el real es Fase 5) con labels visibles y campos tipados.
- Google Maps con patrón iframe absoluto (`relative w-full overflow-hidden aspect-video` + `iframe absolute inset-0`), sin width/height fijos.
- Enlace "Cómo llegar".

### Soporte

- Componentes UI nuevos: `Accordion`, `Timeline`, `ResponsiveImage`.
- `Section` extendido con prop `id`.
- `Button` extendido con props `target`/`rel`.
- `BaseLayout` con slot `head` para preloads.
- Datos de contenido en `src/data/fallback/` (home, about, admissions, contact, levels).
- Placeholders fotográficos descargados a `public/branding/placeholders/` (script `scripts/download-placeholders.py`).
- Página `aviso-de-privacidad` para evitar 404 del footer.
- Navbar sin enlace roto a `/noticias`.

---

## Clases no negociables aplicadas

- `min-w-0` en hijos de flex/grid (hero, cards, directorio, formulario, timeline).
- `w-full max-w-full` en imágenes e iframes (ResponsiveImage, mapa, video).
- `overflow-x-auto` disponible para contenedores de tablas (no se usan tablas en estas páginas).
- `break-words` / `word-break: break-words` en textos largos (directorio, FAQ, descripciones).

---

## Estado de ejecución

| #   | Paso                                                                             | Estado         | Commit | Dificultad | Notas |
| --- | -------------------------------------------------------------------------------- | -------------- | ------ | ---------- | ----- |
| 1   | Componentes UI (Accordion, Timeline, ResponsiveImage, Section id, Button target) | [✓] Completado | —      | 🟡         | —     |
| 2   | Home `/`                                                                         | [✓] Completado | —      | 🟠         | —     |
| 3   | Nosotros `/nosotros`                                                             | [✓] Completado | —      | 🟠         | —     |
| 4   | Niveles `/niveles` + `[slug]` + NivelLayout                                      | [✓] Completado | —      | 🟠         | —     |
| 5   | Admisiones `/admisiones` + JSON-LD FAQ                                           | [✓] Completado | —      | 🟡         | —     |
| 6   | Contacto `/contacto` + mapa iframe                                               | [✓] Completado | —      | 🟡         | —     |
| 7   | Navbar/Footer enlaces                                                            | [✓] Completado | —      | 🟢         | —     |
| 8   | Build + `astro check` (0 errores)                                                | [✓] Completado | —      | 🟢         | —     |
| 9   | Verificación Lighthouse + scroll horizontal                                      | [✓] Completado | —      | 🟢         | —     |

> Nota: no se realizaron commits durante la ejecución (el usuario no lo solicitó explícitamente en esta sesión).

---

## Resultados de verificación (GATE 3)

### Lighthouse móvil (Chrome headless, localhost:4321)

| Página                | Performance | Accessibility | Best-Practices | SEO |
| --------------------- | ----------- | ------------- | -------------- | --- |
| `/` (Home)            | 97          | 100           | 100            | 100 |
| `/nosotros`           | 99          | 98            | 100            | 100 |
| `/niveles/preescolar` | 99          | 97            | 100            | 100 |
| `/admisiones`         | 100         | 96            | 100            | 100 |
| `/contacto`           | 100         | 100           | 100            | 100 |

**Todas ≥ 95 en todas las categorías.** ✓

### Scroll horizontal (harness con iframes, 10 páginas × 4 viewports = 40 checks)

| Viewport | Resultado   |
| -------- | ----------- |
| 320px    | 0 overflows |
| 375px    | 0 overflows |
| 768px    | 0 overflows |
| 1440px   | 0 overflows |

**Cero scroll horizontal en todos los viewports.** ✓

### TypeScript

- `astro check`: 0 errores, 0 warnings (11 hints pre-existentes).

---

## Incidentes y desvíos

- **2026-08-28 17:31** — Error de build por rutas relativas incorrectas en `niveles.astro` y `NivelLayout.astro`. Corregido (`../` vs `../../`).
- **2026-08-28 17:39** — Lighthouse fallaba con `--headless` (modo legacy). Resuelto usando `--headless=new`.
- **2026-08-28 17:44** — Home en 95 (LCP 2.6s, CLS 0.079). Optimizado: hero photo reducido a 800×600 (192KB → 89KB) + preload + fix de `height:100%` en CSS. Resultado: 97 (LCP 2.3s).
- **2026-08-28 17:45** — 2 errores TS en `contacto.astro` (type de input string, Button sin `target`). Corregidos con tipado `FormField` y props `target`/`rel` en Button.
- **Desvío de alcance:** se creó `/niveles/media-tecnica` (además de los 3 solicitados) porque el config tiene 4 niveles habilitados y el footer enlaza a todos; evita 404.
- **Desvío de alcance:** se creó `/aviso-de-privacidad` para evitar 404 del enlace del footer existente.
- **Placeholders:** las fotos son de picsum.photos (semillas descriptivas). Deben reemplazarse por fotografía real del colegio en `public/branding/placeholders/` antes de producción.

---

## Trabajo futuro

- Fase 5: formulario de contacto real (Supabase + WhatsApp).
- Reemplazar placeholders por fotografía real del colegio.
- Página `/noticias` (enlazada en fases posteriores).
