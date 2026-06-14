/** Client-side cookie helpers (readable by middleware when not httpOnly). */

const SMS_TOKEN = "sms_token";
export const PLATFORM_TOKEN = "sms_platform_token";

export function setCookie(name: string, value: string, maxAgeSec?: number): void {
  if (typeof document === "undefined") return;
  // JWT is base64url — avoid encoding so middleware and the browser agree on the value.
  let s = `${name}=${value}; path=/; SameSite=Lax`;
  if (maxAgeSec !== undefined && maxAgeSec > 0) {
    s += `; max-age=${Math.floor(maxAgeSec)}`;
  }
  document.cookie = s;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      const raw = part.slice(name.length + 1);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    const legacy = encodeURIComponent(name);
    if (part.startsWith(`${legacy}=`)) {
      try {
        return decodeURIComponent(part.slice(legacy.length + 1));
      } catch {
        return part.slice(legacy.length + 1);
      }
    }
  }
  return null;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function getSmsTokenFromCookie(): string | null {
  return getCookie(SMS_TOKEN);
}

export function setSmsTokenCookie(token: string, maxAgeSec?: number): void {
  setCookie(SMS_TOKEN, token, maxAgeSec);
}

export function deleteSmsTokenCookie(): void {
  deleteCookie(SMS_TOKEN);
}

export function getPlatformTokenFromCookie(): string | null {
  return getCookie(PLATFORM_TOKEN);
}

export function setPlatformTokenCookie(token: string, maxAgeSec?: number): void {
  setCookie(PLATFORM_TOKEN, token, maxAgeSec);
}

export function deletePlatformTokenCookie(): void {
  deleteCookie(PLATFORM_TOKEN);
}

export { jwtCookieMaxAge } from "./jwtPayload";
