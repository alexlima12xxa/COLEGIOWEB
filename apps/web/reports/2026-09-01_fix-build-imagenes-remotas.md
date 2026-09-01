# Fix build por imágenes remotas inaccesibles (inferSize)

> **Creado:** 2026-09-01
> **Proyecto:** lunar-limit (WEB-MODELO-1)
> **Stack:** Astro 7.2.9 SSG · TypeScript strict · Supabase (Storage) · Vercel · pnpm
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** 🟡 EN PROGRESO

---

## Plan original

### Objetivo

Desbloquear el build y eliminar el riesgo recurrente de datos/imágenes rotas en producción.

### Contexto verificado (2026-09-01)

- `ContentImage.astro` usa `<Picture inferSize>` para URLs remotas → descarga en build-time. Si la URL responde 404/403, el build de Vercel (sin caché) falla. **Mecanismo confirmado.**
- **Causa declarada refutada:** `noticias/prueba.png` responde **200 OK** (image/png) en el momento de la verificación. El build local pasa reutilizando caché (`node_modules/.astro/assets`).
- **Problema real:** la BD de producción contiene **3 filas de prueba publicadas** (`webhook-test`, `prueba-final`, `prueba-rebuild`) que generan rutas públicas y entradas en el sitemap. Cualquier borrado de `prueba.png` vuelve a romper el build.

### Pasos

1. **Despublicar/eliminar las 3 filas de prueba** (`webhook-test`, `prueba-final`, `prueba-rebuild`) en el dashboard de Supabase (tabla `noticias`, tenant actual). _Manual, desbloquea el sitemap y el sitio público._
2. **Verificar build limpio**: borrar `node_modules/.astro/assets` y ejecutar `pnpm build`. _Debe pasar: el archivo responde 200._
3. **Resiliencia en la capa de datos** (`src/shared/db/content.ts`): al parsear filas, validar accesibilidad de `imagenPath` (HEAD) y sustituir la imagen inaccesible por un placeholder local (`/branding/placeholders/...`), nunca fallar el build. Cache a nivel de módulo (`Map<url, boolean>`).
4. **Endurecer `ContentImage`**: si el HEAD falla y no hay fallback local disponible, renderizar el `div.contentImage--empty` ya existente (mantiene aspect-ratio 16/9 y evita CLS).
5. **Protección contra reintroducción** (opcional): validación en `supabase/functions/rebuild-webhook/index.ts` que rechace slugs tipo `prueba-*`/`test-*`, o documentar el riesgo en README.

### Archivos involucrados

| Archivo                                         | Rol                                                |
| ----------------------------------------------- | -------------------------------------------------- |
| BD `noticias` (dashboard)                       | Paso 1 — limpiar filas de prueba                   |
| `src/shared/db/content.ts`                      | Paso 3 — validación de imagen accesible + fallback |
| `src/shared/ui/ContentImage/ContentImage.astro` | Paso 4 — render placeholder si HEAD falla          |
| `supabase/functions/rebuild-webhook/index.ts`   | Paso 5 — rechazar datos de prueba                  |

### Trade-offs

- **Validación en data layer vs. ContentImage:** el data layer es mejor — una sola fuente de verdad, no duplica requests por cada variante (card + detalle del mismo asset), y mantiene el contrato `imagenPath` intacto.
- **HEAD + inferSize:** duplica el round-trip de red por imagen en build. Con ~5 imágenes es irrelevante; el `Map` cache lo mitiga si crece.
- **Alternativa descartada:** quitar `inferSize` y declarar width/height desde la BD — requiere cambio de esquema, no justificado.
- **Alternativa descartada:** fallback directo a `<img>` sin procesar — pierde AVIF/WebP/srcset, contradice el objetivo de performance.

### Riesgos identificados

- El `contentImage--empty` es un div sin `alt` — si se usa como fallback visible, la imagen decorativa pierde accesibilidad. Debe ir acompañado de `aria-hidden`.
- HEAD en Supabase Storage devuelve **400** para rutas malformadas y **404** para objetos faltantes. La lógica debe tratar solo `2xx` como válido.
- Borrar la caché de imágenes (`node_modules/.astro/assets`) requiere autorización.

### Puntos de validación

- Paso 1 → `sitemap.xml` ya no incluye slugs de prueba.
- Paso 2 → `pnpm build` completo sin errores y sin reutilizar caché.
- Paso 3 → `pnpm build` exitoso incluso si `prueba.png` vuelve a borrarse.
- Paso 4 → Lighthouse de `/noticias/[slug]` sin regresión CLS.

### Fuera de alcance

- Migración del contenido editorial fuera de Decap CMS (ya eliminado).
- Validación de imágenes en el flujo de creación de contenido del panel (no existe panel aún).

---

## Estado de ejecución

| #   | Paso                                                   | Estado         | Commit     | Dificultad | Notas                                                                         |
| --- | ------------------------------------------------------ | -------------- | ---------- | ---------- | ----------------------------------------------------------------------------- |
| 1   | Despublicar/eliminar filas de prueba en BD (dashboard) | [✓] Completado | sin commit | 🟢         | Usuario eliminó las 3 filas; BD noticias vacía (0 filas) → usa fallback local |
| 2   | Verificar build limpio sin caché de imágenes           | [✓] Completado | sin commit | 🟢         | Build limpio OK (25 páginas, fallback local). Sin slugs de prueba en sitemap  |
| 3   | Resiliencia en content.ts (HEAD + fallback local)      | [✓] Completado | `b39b05f`  | 🟡         | Implementado ensureAccessibleImage + cache Map; build OK                      |
| 4   | Endurecer ContentImage (placeholder si HEAD falla)     | [✓] Completado | `3f4a384`  | 🟡         | Degradación a contentImage--empty si remota inaccesible; build OK             |
| 5   | Protección contra reintroducción (rebuild-webhook)     | ⏳ Pendiente   | —          | 🟢         | Opcional                                                                      |

---

## Registro de commits

- `b39b05f` — fix(db): degradar a placeholder las imagenes de Storage inaccesibles (Paso 3)
- `3f4a384` — fix(ui): degradar a placeholder las imagenes remotas inaccesibles (Paso 4)

---

## Incidentes y desvíos

- **2026-09-01 (verificación):** La causa declarada en el plan original ("prueba.png no accesible") quedó refutada — el archivo responde 200 OK. El problema real es la presencia de 3 filas de prueba publicadas en BD producción. Se corrigió el plan en consecuencia.
- **2026-09-01 (Paso 1):** El usuario eliminó las 3 filas de prueba desde el dashboard. La tabla `noticias` del tenant quedó vacía (0 filas), por lo que el build usará el fallback local (`src/data/fallback/noticias.json`, 12 noticias). Sin cambios de código → sin commit.
- **2026-09-01 (Paso 2):** Se borró `node_modules/.astro/assets` y se ejecutó `pnpm build` limpio → exitoso (25 páginas, 2.45s). El sitemap ya no incluye slugs de prueba (`webhook-test`, `prueba-final`, `prueba-rebuild`); el único match de "prueba" es la noticia legítima `resultados-pruebas-saber-2026` del fallback. Sin cambios de código → sin commit.
- **2026-09-01 (Paso 3):** Implementada resiliencia en `src/shared/db/content.ts`: `isImageAccessible()` (HEAD, solo 2xx válido), cache `Map<string, boolean>` a nivel de módulo, y `ensureAccessibleImage()` que sustituye una imagen de Storage inaccesible por `/branding/placeholders/gallery-1.jpg`. Build OK (25 páginas). Prueba funcional: `prueba.png` → accesible, `no-existe-xyz.png` → inaccesible (degradación correcta).
- **2026-09-01 (Paso 4):** Endurecido `src/shared/ui/ContentImage/ContentImage.astro`: añadida `isImageAccessible()` (HEAD, cache Map) y degradación a `contentImage--empty` cuando la imagen remota es inaccesible. Se corrigió la condición de renderizado: `resolved && !isRemote` para el `<img>` local, de modo que una remota inaccesible cae en el placeholder (no en un `<img>` roto). Build OK (25 páginas). Prueba de decisión: 4 casos correctos (remota accesible→Picture, remota inaccesible→placeholder, local→img, sin imagen→placeholder).
