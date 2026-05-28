/** Idle session timeout (must align with API SESSION_INACTIVITY_MINUTES). */
export function sessionInactivityMs(): number {
  const raw = process.env.NEXT_PUBLIC_SESSION_INACTIVITY_MINUTES;
  const minutes = raw ? Number(raw) : 15;
  if (!Number.isFinite(minutes) || minutes < 1) return 15 * 60_000;
  return minutes * 60_000;
}

export function sessionInactivityMinutes(): number {
  return sessionInactivityMs() / 60_000;
}
