/**
 * Rate limiting simple en cliente para formularios públicos.
 *
 * Usa localStorage para recordar el último envío y evitar spam básico.
 * No es una barrera de seguridad robusta (localStorage puede borrarse),
 * pero reduce envíos accidentales y bots sencillos.
 */

const DEFAULT_MINUTES = 2;
const DEFAULT_FORM = "admissions";

function storageKey(form: string): string {
  return `${form}_last_submit`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && window.localStorage !== undefined;
}

export function isRateLimited(
  minutes = DEFAULT_MINUTES,
  form = DEFAULT_FORM,
): boolean {
  if (!isBrowser()) return false;

  const last = localStorage.getItem(storageKey(form));
  if (!last) return false;

  const elapsed = Date.now() - Number(last);
  return elapsed >= 0 && elapsed < minutes * 60 * 1000;
}

export function markSubmitted(form = DEFAULT_FORM): void {
  if (!isBrowser()) return;
  localStorage.setItem(storageKey(form), String(Date.now()));
}

export function secondsUntilNext(
  minutes = DEFAULT_MINUTES,
  form = DEFAULT_FORM,
): number {
  if (!isBrowser()) return 0;

  const last = localStorage.getItem(storageKey(form));
  if (!last) return 0;

  const remaining = minutes * 60 * 1000 - (Date.now() - Number(last));
  return Math.max(0, Math.ceil(remaining / 1000));
}

export function clearRateLimit(form = DEFAULT_FORM): void {
  if (!isBrowser()) return;
  localStorage.removeItem(storageKey(form));
}
