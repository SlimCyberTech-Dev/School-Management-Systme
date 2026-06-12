import axios from "axios";
import { clearPlatformSessionCookie, isValidPlatformToken } from "@/lib/platformSession";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const PLATFORM_TOKEN_KEY = "sms_platform_token";

export const platformApi = axios.create({
  baseURL: `${baseURL}/platform`,
  headers: { "Content-Type": "application/json" },
});

platformApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const isLogin = String(config.url ?? "").includes("/auth/login");
    const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
    if (token && isValidPlatformToken(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!isLogin) {
      delete config.headers.Authorization;
    }
  }
  return config;
});

platformApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined" && err.response?.status === 401) {
      const path = window.location.pathname;
      if (path.startsWith("/platform") && !path.startsWith("/platform/login")) {
        setPlatformToken(null);
        clearPlatformSessionCookie();
        window.location.href = "/platform/login";
      }
    }
    return Promise.reject(err);
  },
);

export function setPlatformToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token && isValidPlatformToken(token)) {
    localStorage.setItem(PLATFORM_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(PLATFORM_TOKEN_KEY);
  }
}
