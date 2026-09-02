# Onboarding de un colegio nuevo

Guía breve para desplegar esta plantilla para un colegio nuevo. La plantilla es
multi-tenant por instancia: cada colegio es un deploy independiente que se
configura con `src/site.config.ts` + `public/branding/`.

---

## 1. Instanciar el tenant

Crea un `.env` nuevo (o actualiza el existente) con un `PUBLIC_TENANT_ID`
único para el colegio:

```bash
PUBLIC_TENANT_ID=colegio-ejemplo
```

> El `tenant_id` se usa para aislar los datos del colegio en Supabase
> (tablas con RLS). No debe repetirse entre colegios.

## 2. Editar `src/site.config.ts`

Este archivo es la fuente de verdad del white-label. Cambia:

- **`identity`**: nombre del colegio, lema, descripción, año de fundación.
- **`branding.colors`**: paleta de marca (primario, acentos, superficies, texto).
- **`branding.fonts`** y **`branding.radius`**: tipografías y radios (opcional).
- **`contact`** y **`social`**: dirección, teléfono, WhatsApp, email, redes.
- **`seo`**: título, descripción, URL del sitio, og-image.
- **`supabase`**: URL y nombres de env vars de la instancia del colegio.

El build valida el archivo (contraste WCAG ≥ 4.5:1, WhatsApp E.164, assets,
longitudes de texto) y falla si algo no cumple.

## 3. Logo del colegio

Coloca el logo real del colegio en `public/branding/`:

```
public/branding/logo.svg          # o logo.png — navbar y drawer
public/branding/logo-inverse.svg  # opcional — versión clara para el footer
```

Luego apunta las rutas en `site.config.ts`:

```ts
branding: {
  assets: {
    logo: "/branding/logo.svg",
    logoInverse: "/branding/logo-inverse.svg",
    // ...
  },
},
```

**Si NO hay logo real** (o quieres empezar rápido), deja `logo` y
`logoInverse` vacíos/omitidos: el componente `Logo` genera un fallback
automático (círculo + triángulo + nombre del colegio) usando los tokens de
marca, sin depender de fuentes dentro de `<img>`.

> El logo real puede ser PNG o SVG (cualquier extensión). Si usas SVG,
> asegúrate de que el wordmark esté convertido a `<path>` (no `<text>`),
> porque las fuentes no se renderizan dentro de un `<img>`.

## 4. Configurar dominio y env vars en Vercel

1. Importa el repo en Vercel con `rootDirectory = apps/web`.
2. Añade el dominio del colegio (DNS en Cloudflare Registrar).
3. Configura las env vars del proyecto:
   - `PUBLIC_TENANT_ID`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PUBLIC_SITE_URL` (si se usa)
4. (Opcional) Configura el deploy hook para el rebuild automático vía
   Supabase webhook.

## 5. Validar, compilar y desplegar

```bash
pnpm --filter @web-modelo/web check
pnpm --filter @web-modelo/web build
```

Si ambos pasan, haz deploy (push a la rama de producción o `vercel --prod`).

---

## Checklist rápido

- [ ] `PUBLIC_TENANT_ID` único en `.env`
- [ ] `site.config.ts` con nombre, colores, contactos y rutas correctas
- [ ] Logo real en `public/branding/logo.*` (o campos vacíos para fallback)
- [ ] Dominio y env vars configurados en Vercel
- [ ] `pnpm --filter @web-modelo/web check` y `build` pasan