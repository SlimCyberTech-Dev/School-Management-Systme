import { query } from "../../config/db.js";
import { loadEnv } from "../../config/env.js";

const ACTIVITY_TOUCH_THROTTLE_SECONDS = 30;

export function sessionInactivityMinutes(): number {
  return loadEnv().SESSION_INACTIVITY_MINUTES;
}

export function idleExpiresAtFrom(lastActivityAt: Date, minutes = sessionInactivityMinutes()): Date {
  return new Date(lastActivityAt.getTime() + minutes * 60_000);
}

/**
 * Validates session is within the inactivity window and bumps last_activity_at (throttled).
 * Returns null and revokes the session when idle timeout has passed.
 */
export async function validateAndTouchSession(
  sessionId: string,
  userId: string,
  tokenHash: string,
): Promise<{ idleExpiresAt: Date } | null> {
  const minutes = sessionInactivityMinutes();

  const { rows } = await query<{ last_activity_at: Date }>(
    `SELECT last_activity_at FROM auth_sessions
     WHERE id = $1 AND user_id = $2 AND token_hash = $3
       AND revoked_at IS NULL AND expires_at > NOW()
       AND last_activity_at > NOW() - ($4::int * INTERVAL '1 minute')`,
    [sessionId, userId, tokenHash, minutes],
  );

  if (!rows[0]) {
    await query(
      `UPDATE auth_sessions SET revoked_at = NOW()
       WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
         AND last_activity_at <= NOW() - ($3::int * INTERVAL '1 minute')`,
      [sessionId, userId, minutes],
    );
    return null;
  }

  await query(
    `UPDATE auth_sessions SET last_activity_at = NOW()
     WHERE id = $1
       AND last_activity_at < NOW() - ($2::int * INTERVAL '1 second')`,
    [sessionId, ACTIVITY_TOUCH_THROTTLE_SECONDS],
  );

  return { idleExpiresAt: idleExpiresAtFrom(new Date()) };
}
