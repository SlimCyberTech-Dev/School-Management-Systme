import { decodeJwtPayload } from "@/lib/jwtPayload";

/** Platform JWTs include aud: "platform" (see apps/api signPlatformToken). */
export function isValidPlatformToken(token: string | null | undefined): boolean {
  if (!token?.trim()) return false;
  const payload = decodeJwtPayload(token.trim());
  if (!payload) return false;
  if (payload.aud !== "platform") return false;
  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  return exp > Math.floor(Date.now() / 1000);
}

export function clearPlatformSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "sms_platform_token=; path=/; max-age=0; SameSite=Lax";
}
