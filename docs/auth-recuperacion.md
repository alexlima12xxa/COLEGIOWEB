# Autenticación del panel admin — recuperación de contraseña e invitaciones

> Cómo funciona el acceso al panel (`apps/admin`), los correos de Supabase Auth
> y la configuración de Resend + SMTP.
> Actualizado: 2026-09-21

## Resumen

El panel admin usa **Supabase Auth** (email + contraseña) con `@supabase/ssr`.
Hay **dos flujos** que dependen de un enlace por correo y comparten la misma
infraestructura:

| Flujo | Disparador | Template Supabase | Tipo OTP |
|-------|-----------|-------------------|----------|
| **Invitación** | Superadmin da de alta un colegio en `/operador` (`inviteUserByEmail`) | *Invite user* | `invite` |
| **Recuperación** | Director pulsa «¿Olvidaste tu contraseña?» en `/login` | *Reset password* | `recovery` |

Ambos terminan en la misma página `/reset-password`, donde el usuario fija su
contraseña. El enlace de email nunca contiene la contraseña: solo un token de un
solo uso.

## Diagrama de flujo

```
/login  ──(modal «¿Olvidaste?»)──►  resetPasswordForEmail()
                                        │
                                        ▼
                                  Email (Resend)
                                        │  enlace con token_hash
                                        ▼
                              GET /auth/confirm  ── verifyOtp() ──► sesión
                                        │
                                        ▼
                              /reset-password  ── updateUser({ password })
                                        │
                                        ▼  signOut({ scope: "global" })
                                    /login?reset=1
```

## 1. Resend (dominio + API key)

1. En [resend.com](https://resend.com) → **Domains → Add Domain** (`yachay-ia.com`).
2. Resend entrega 3 registros DNS; se agregan en **Cloudflare** con **Proxy
   desactivado (nube gris / DNS only)** — Cloudflare solo proxya HTTP, no MX:
   - `MX` en `send.yachay-ia.com`
   - `TXT` SPF en `send.yachay-ia.com` (`v=spf1 include:amazonses.com ~all`)
   - `TXT` DKIM en `resend._domainkey.yachay-ia.com`
3. Esperar a que el dominio figure **Verified**.
4. Crear una **API Key** con permiso *Sending access*.

## 2. Supabase Auth (dashboard)

> Estos ajustes son del proyecto **cloud**. `supabase/config.toml` solo aplica al
> entorno **local** (`supabase start`); mantener ambos con la misma policy.

### 2.1 SMTP (Project Settings → Auth → SMTP)

```
Host:         smtp.resend.com
Port:         465
Username:     resend
Password:     <RESEND_API_KEY>
Sender email: soporte@yachay-ia.com
Sender name:  YACHAY IA
```

> El remitente debe pertenecer al dominio verificado en Resend.

Esto sustituye al SMTP por defecto de Supabase (límite ~2-4 correos/hora).

### 2.2 URL Configuration (Authentication → URL Configuration)

```
Site URL:       https://admin.yachay-ia.com
Redirect URLs:  https://admin.yachay-ia.com/**
                http://localhost:3000/**
```

### 2.3 Email Templates (Authentication → Email Templates)

**Reset password** y **Invite user** deben apuntar al route handler con
`token_hash` (flujo robusto cross-dispositivo):

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/reset-password
```

### 2.4 Password strength

Mínimo **8** caracteres y requisito
`lower_upper_letters_digits_symbols` (1 minúscula, 1 mayúscula, 1 número, 1
símbolo). En local se define en `supabase/config.toml` (`[auth]`).

### 2.5 Signups

**Desactivar** «Allow new users to sign up» (Authentication → Sign In /
Providers). Las cuentas del panel solo se crean por invitación del operador.

## 3. Variables de entorno

En `apps/admin` (Vercel, server-side sin prefijo `NEXT_PUBLIC_` no aplica aquí):

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_APP_URL` | Origen público del panel; construye los enlaces de correo y el `redirectTo` de la provisión. Sin barra final. |
| `SUPABASE_SERVICE_ROLE_KEY` | Operaciones cross-tenant del operador (server-only). |

## 4. Desarrollo local

Los correos **no se envían de verdad**: el SMTP local de Supabase los captura en
**Mailpit** → `http://127.0.0.1:54324`. Copia el enlace del correo y ábrelo.

```bash
npx supabase start          # levanta la BD + Mailpit
pnpm --filter @web-modelo/admin dev
```

## 5. Mapa de código

| Archivo | Responsabilidad |
|---------|-----------------|
| `app/login/login-form.tsx` | Login + ojito + modal «¿Olvidaste tu contraseña?» |
| `app/login/actions.ts` | `login`, `logout`, `forgotPassword` |
| `app/auth/confirm/route.ts` | Canjea `token_hash` por sesión (`verifyOtp`) |
| `app/reset-password/page.tsx` | Guard de sesión + layout |
| `app/reset-password/reset-password-form.tsx` | Formulario (nueva + confirmar, con ojito) |
| `app/reset-password/actions.ts` | Valida política y ejecuta `updateUser` |
| `lib/operator/provision.ts` | `inviteUserByEmail` con `redirectTo` a `/auth/confirm` |
| `app/admin/components/icons.tsx` | `EyeIcon` / `EyeOffIcon` |

## 6. Seguridad

- **Anti user-enumeration**: `forgotPassword` responde siempre lo mismo.
- **Anti open-redirect**: `/auth/confirm` solo acepta `next` interno.
- **Revocación de sesiones**: tras cambiar la contraseña se ejecuta
  `signOut({ scope: "global" })`.
- **Roles en `app_metadata`**: `role` y `tenant_id` los firma Supabase (no
  editables por el usuario).
- **Nunca se revela una contraseña**: solo se resetea.

## 7. Pendiente (requiere Supabase Pro)

- **MFA (TOTP)** para el superadmin.
- Rate limits configurables / captcha en el formulario de recuperación.

## 8. Troubleshooting

| Síntoma | Causa probable |
|---------|----------------|
| No llega el correo | Dominio Resend sin verificar, o SMTP sin configurar |
| El enlace lleva a `/login?error=enlace` | Token caducado/usado, o template sin `token_hash` |
| `redirectTo` rechazado por Supabase | URL no incluida en *Redirect URLs* |
| El usuario invitado no puede fijar contraseña | `NEXT_PUBLIC_APP_URL` sin definir (cae al fallback) |
