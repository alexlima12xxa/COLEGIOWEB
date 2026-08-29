/**
 * Rate limiting simple en cliente para formularios públicos.
 *
 * Usa localStorage para recordar el último envío y evitar spam básico.
 * No es una barrera de seguridad robusta (localStorage puede borrarse),
 * pero reduce envíos accidentales y bots sencillos.
 */

const STORAGE_KEY = "admissions_last_submit";
const DEFAULT_MINUTES = 2;

function isBrowser(): boolean {
  return typeof window !== "undefined" && window.localStorage !== undefined;
}

export function isRateLimited(minutes = DEFAULT_MINUTES): boolean {
  if (!isBrowser()) return false;

  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return false;

  const elapsed = Date.now() - Number(last);
  return elapsed >= 0 && elapsed < minutes * 60 * 1000;
}

export function markSubmitted(): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function secondsUntilNext(minutes = DEFAULT_MINUTES): number {
  if (!isBrowser()) return 0;

  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return 0;

  const remaining = minutes * 60 * 1000 - (Date.now() - Number(last));
  return Math.max(0, Math.ceil(remaining / 1000));
}

export function clearRateLimit(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}
