# Formulario de admisiones con doble vía (Supabase + WhatsApp)

> **Creado:** 2026-08-28 19:25
> **Proyecto:** WEB-MODELO-1 (Colegio Piloto)
> **Stack:** Astro 7.2.9 (SSG) · TypeScript strict · Tailwind v4 · Supabase
> **Riesgo:** MEDIO
> **Modo de ejecución:** MANUAL
> **Estado:** 🟡 EN PROGRESO

---

## Plan original

Tareas solicitadas por el usuario (GATE 5):

1. Formulario de admisiones en `/admisiones`: selector de grado desde config, campos
   (nombre padre, teléfono, email, grado, mensaje), botón "Enviar por WhatsApp" verde.
2. Doble vía: (1) POST a tabla leads con anon key (RLS solo INSERT, sin SELECT) →
   (2) abrir WhatsApp con mensaje generado vía encodeURIComponent. Si Supabase falla,
   igual abrir WhatsApp (no bloquear al usuario).
3. Honeypot invisible + rate limiting simple + aviso de privacidad con checkbox.
4. Número de WhatsApp desde site.config.ts (formato internacional).

**Criterio de aceptación:**
- lead persiste en Supabase Y se abre WhatsApp con mensaje correcto
- sin BD → igual abre WhatsApp

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Migración Supabase: RLS INSERT-only para anon en leads | [✓] Completado | — | 🟡 | Grants y políticas actualizados |
| 2 | Tokens CSS: variantes success (verde WhatsApp) | [✓] Completado | — | 🟢 | `--color-success-hover/active` |
| 3 | Button: variante `success` + props `id`/`disabled` | [✓] Completado | — | 🟢 | Extensión del componente existente |
| 4 | Utilidades: rateLimit.ts, whatsapp.ts, browserClient.ts | [✓] Completado | — | 🔵 | localStorage, encodeURIComponent, anon key |
| 5 | Componente Input reutilizable (text/email/tel/textarea/select) | [✓] Completado | — | 🔵 | BEM + tokens + a11y |
| 6 | Componente AdmissionForm (honeypot, checkbox, validación, doble vía) | [✓] Completado | — | 🟠 | Script con patrón astro:page-load |
| 7 | Página /admisiones: integrar AdmissionForm | [✓] Completado | — | 🔵 | Sección nueva tras el hero |
| 8 | .env.example: añadir PUBLIC_SUPABASE_ANON_KEY | [✓] Completado | — | 🟢 | Documentación |
| 9 | Verificación: astro check + build + bundle + mensaje WhatsApp | [✓] Completado | — | 🔵 | 0 errores, build OK |

---

## Registro de commits

_(Pendiente — se propone commit al finalizar)_

---

## Incidentes y desvíos

- **2026-08-28 19:19** — `define:vars` en `<script>` fuerza `is:inline` y rompe imports de módulos. Se reemplazó por `data-*` attributes + `<script type="application/json">` para niveles.
- **2026-08-28 19:21** — Script inicial no compatible con View Transitions (se ejecutaba una sola vez). Se refactorizó al patrón `astro:page-load` + guard `data-initialized`, igual que Navbar/Accordion.
- **2026-08-28 19:23** — TypeScript no estrecha `form` dentro de closures; se usó `const formEl: HTMLFormElement = form` tras el guard.
- **2026-08-28 19:24** — Mejora a11y: `setFieldError` ahora actualiza `aria-describedby`; checkbox de privacidad asocia su mensaje de error.
- **Nota:** No se pudo probar el insert real en Supabase (sin credenciales en el entorno). La lógica se verificó por build + inspección del bundle. La migración SQL quedó lista para aplicar.