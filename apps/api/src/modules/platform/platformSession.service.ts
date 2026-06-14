import { platformQuery } from "../../config/db.js";
import { loadEnv } from "../../config/env.js";

const ACTIVITY_TOUCH_THROTTLE_SECONDS = 30;

export function platformSessionInactivityMinutes(): number {
  return loadEnv().SESSION_INACTIVITY_MINUTES;
}

export function platformIdleExpiresAtFrom(
  lastActivityAt: Date,
  minutes = platformSessionInactivityMinutes(),
): Date {
  return new Date(lastActivityAt.getTime() + minutes * 60_000);
}

export async function validateAndTouchPlatformSession(
  sessionId: string,
  adminId: string,
  tokenHash: string,
): Promise<{ idleExpiresAt: Date } | null> {
  const minutes = platformSessionInactivityMinutes();

  const { rows } = await platformQuery<{ last_activity_at: Date }>(
    `SELECT last_activity_at FROM platform_auth_sessions
     WHERE id = $1 AND admin_id = $2 AND token_hash = $3
       AND revoked_at IS NULL AND expires_at > NOW()
       AND last_activity_at > NOW() - ($4::int * INTERVAL '1 minute')`,
    [sessionId, adminId, tokenHash, minutes],
  );

  if (!rows[0]) {
    await platformQuery(
      `UPDATE platform_auth_sessions SET revoked_at = NOW()
       WHERE id = $1 AND admin_id = $2 AND revoked_at IS NULL
         AND last_activity_at <= NOW() - ($3::int * INTERVAL '1 minute')`,
      [sessionId, adminId, minutes],
    );
    return null;
  }

  await platformQuery(
    `UPDATE platform_auth_sessions SET last_activity_at = NOW()
     WHERE id = $1
       AND last_activity_at < NOW() - ($2::int * INTERVAL '1 second')`,
    [sessionId, ACTIVITY_TOUCH_THROTTLE_SECONDS],
  );

  return { idleExpiresAt: platformIdleExpiresAtFrom(new Date()) };
}

export async function revokePlatformSession(sessionId: string): Promise<void> {
  await platformQuery(
    `UPDATE platform_auth_sessions SET revoked_at = NOW()
     WHERE id = $1 AND revoked_at IS NULL`,
    [sessionId],
  );
}

export async function revokeAllPlatformSessions(adminId: string): Promise<void> {
  await platformQuery(
    `UPDATE platform_auth_sessions SET revoked_at = NOW()
     WHERE admin_id = $1 AND revoked_at IS NULL`,
    [adminId],
  );
}
