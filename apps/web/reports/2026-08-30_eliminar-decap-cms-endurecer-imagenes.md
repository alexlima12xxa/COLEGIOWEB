# Eliminar Decap CMS + Endurecer imágenes de Supabase Storage

> **Creado:** 2026-08-30
> **Proyecto:** WEB-MODELO-1 (Colegio Piloto)
> **Stack:** Astro 7.2.9 (SSG) + Tailwind v4 + Supabase · Vercel
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** ✅ COMPLETADO

---

## Plan (instrucción del usuario)

Dos decisiones que se ejecutan juntas:

**PARTE 1 — Eliminar Decap CMS** (Supabase queda como ÚNICA fuente editorial, con fallback JSON):

1. Eliminar `public/admin/` completo (config.yml + index.html).
2. Eliminar `src/content/` completo (noticias, circulares, paginas, galeria) y `src/content.config.ts`.
3. Eliminar `public/media/uploads/` (3 imágenes de test: yachay.png y 2 jpg).
4. Refactorizar `src/shared/db/content.ts`: quitar fileSlug/toNoticia/toCircular/getCmsNoticias/getCmsCirculares + imports sin uso (getCollection, CollectionEntry, uuidv5) + quitar el bloque try/catch CMS en getAllNoticias/getAllCirculares. Cadena final: Supabase → fallback JSON. NO tocar schema.ts/client.ts/storage.ts/fallbacks.
5. Quitar `decap-cms` de package.json.

**PARTE 2 — Endurecer imágenes de Supabase Storage:** 6. `astro.config.ts`: `image.remotePatterns` de `[{ protocol: "https" }]` → `[{ protocol: "https", hostname: "*.supabase.co" }]`. 7. Corregir comentario de `image` (remotas se optimizan vía `/_image` en runtime serverless Vercel con cache; locales `/branding/` en build). 8. Unificar `ResponsiveImage.astro` con `ContentImage.astro`: usar `<Picture>` (o delegar en ContentImage) para fuentes remotas (Supabase) o locales en `src/`; conservar `<img>` nativo solo para `/public`. No romper galería bento del Home.

---

## Criterios de aceptación

- [ ] `pnpm build` compila sin errores
- [ ] `/noticias` y `/circulares` renderizan con fallback JSON (sin env Supabase)
- [ ] `grep "astro:content"` y `"getCollection"` en src/ → sin resultados
- [ ] `grep "decap"` en package.json → sin resultados
- [ ] `astro.config.ts`: remotePatterns restringido a `*.supabase.co`
- [ ] Galería bento (Home) renderiza sin errores tras unificar ResponsiveImage

---

## Estado de ejecución

| #   | Paso                                                                    | Estado        | Commit    | Dificultad | Notas                                 |
| --- | ----------------------------------------------------------------------- | ------------- | --------- | ---------- | ------------------------------------- |
| 1   | Eliminar public/admin + src/content + content.config.ts + media/uploads | ✅ Completado | `c77b7bc` | 🟢         | fallbacks usan /branding/, no /media/ |
| 2   | Refactorizar content.ts (quitar CMS, cadena Supabase→fallback)          | ✅ Completado | `c77b7bc` | 🟡         |                                       |
| 3   | Quitar decap-cms de package.json                                        | ✅ Completado | `c77b7bc` | 🟢         | -443 paquetes                         |
| 4   | Restringir remotePatterns + corregir comentario image                   | ✅ Completado | `c77b7bc` | 🟢         | `*.supabase.co`                       |
| 5   | Unificar ResponsiveImage con ContentImage                               | ✅ Completado | `c77b7bc` | 🟡         | 3 consumidores OK                     |

---

## Registro de commits

| Commit    | Paso | Mensaje                                                       |
| --------- | ---- | ------------------------------------------------------------- |
| `c77b7bc` | 1-5  | refactor: eliminar Decap CMS y endurecer imágenes de Supabase |

---

## Incidentes y desvíos

_(Vacío al inicio)_
