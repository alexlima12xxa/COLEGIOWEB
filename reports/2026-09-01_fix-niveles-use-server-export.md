# Fix: error `t.map is not a function` en sección Niveles del panel admin

> **Creado:** 2026-09-01
> **Proyecto:** WEB-MODELO-1
> **Stack:** Next.js 16.3.3 (App Router) + Supabase SSR + pnpm
> **Riesgo:** BAJO
> **Modo de ejecución:** MANUAL
> **Estado:** [✓] COMPLETADO

---

## Plan original

**Problema:** Al abrir `/admin/niveles`, el panel se cuelga y la consola muestra
`Uncaught TypeError: t.map is not a function` (chunks `11o-yvjsor_1x.js` /
`1dgd76_cro591.js`).

**Causa raíz:** `apps/admin/app/admin/niveles/niveles-form.tsx:5` importa la
constante `NIVELES` desde `./actions`, que es un módulo `"use server"`. En
Next.js, los archivos `"use server"` solo pueden exportar funciones async; la
constante `NIVELES` (`niveles/actions.ts:26`) es una exportación inválida que
llega rota al bundle cliente → `NIVELES.map(...)` lanza el error y React falla
al hidratar.

**Fix:** mover `NIVELES` (y su tipo `NivelClave`) a un módulo normal
`niveles-constants.ts`, siguiendo el patrón existente `leads/leads-constants.ts`.

### Pasos

| # | Paso | Descripción |
|---|------|-------------|
| 1 | Crear `niveles-constants.ts` | Módulo normal con `NIVELES` + tipo `NivelClave` |
| 2 | Editar `niveles/actions.ts` | Quitar `export const NIVELES` y `NivelClave`; importarlos del nuevo módulo |
| 3 | Editar `niveles-form.tsx` | Importar `NIVELES` desde `./niveles-constants` (no desde `./actions`) |
| 4 | Verificar build | `pnpm --filter @web-modelo/admin build` |

---

## Estado de ejecución

| # | Paso | Estado | Commit | Dificultad | Notas |
|---|------|--------|--------|------------|-------|
| 1 | Crear `niveles-constants.ts` | [✓] Completado | `bcd38c1` | 🟢 | — |
| 2 | Editar `niveles/actions.ts` | [✓] Completado | `caafc2f` | 🟢 | — |
| 3 | Editar `niveles-form.tsx` | [✓] Completado | `3400ce7` | 🟢 | — |
| 4 | Verificar build | [✓] Completado | sin commit | 🟢 | Build OK + TypeScript OK |

---

## Registro de commits

- `bcd38c1` — refactor(admin): extraer constantes de niveles a modulo compartido (Paso 1)
- `caafc2f` — refactor(admin): importar NIVELES desde modulo compartido en action (Paso 2)
- `3400ce7` — fix(admin): importar NIVELES desde modulo compartido en el formulario (Paso 3)

---

## Incidentes y desvíos

- **2026-09-01 — Error de edición en Paso 2:** durante la edición de `actions.ts`
  se duplicó el bloque `NIVELES` (hasta 4 copias) por un `oldString` mal
  construido. Se detectó al releer el archivo y se corrigió eliminando todas
  las definiciones locales. Sin impacto en el resultado final.
- **Nota:** el cambio en `apps/admin/proxy.ts` (redirección de la raíz `/` al
  login) quedó pendiente de commit en el working tree — pertenece a una tarea
  anterior, no a este plan.