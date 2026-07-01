import axios from "axios";
import { resolveApiBaseUrl } from "@/lib/apiBaseUrl";
import { getPlatformTokenFromCookie } from "@/lib/cookies";
import { isValidPlatformToken } from "@/lib/platformSession";
import { usePlatformStore } from "@/store/platformStore";

const baseURL = resolveApiBaseUrl();

/** @deprecated Use cookie via getPlatformTokenFromCookie — kept for legacy localStorage cleanup. */
export const PLATFORM_TOKEN_KEY = "sms_platform_token";

export const platformApi = axios.create({
  baseURL: `${baseURL}/platform`,
  headers: { "Content-Type": "application/json" },
});

function syncIdleFromHeaders(headers: Record<string, unknown>): void {
  const raw = headers["x-session-idle-expires-at"];
  const idleUnix = typeof raw === "string" ? Number(raw) : NaN;
  if (Number.isFinite(idleUnix)) {
    usePlatformStore.getState().setIdleExpiresAt(idleUnix * 1000);
  }
}

platformApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const isLogin = String(config.url ?? "").includes("/auth/login");
    const token = getPlatformTokenFromCookie();
    if (token && isValidPlatformToken(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!isLogin) {
      delete config.headers.Authorization;
    }
  }
  return config;
});

platformApi.interceptors.response.use(
  (res) => {
    syncIdleFromHeaders(res.headers as Record<string, unknown>);
    return res;
  },
  (err) => {
    if (typeof window !== "undefined" && err.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith("/platform") && !path.startsWith("/platform/login")) {
        usePlatformStore.getState().logout();
        window.location.href = "/platform/login?reason=session";
      }
    }
    return Promise.reject(err);
  },
);

export function setPlatformToken(token: string | null): void {
  usePlatformStore.getState().setToken(token ?? null);
}

/** Remove legacy localStorage token from older builds. */
export function clearLegacyPlatformStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PLATFORM_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
