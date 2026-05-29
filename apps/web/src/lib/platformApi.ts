import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export const PLATFORM_TOKEN_KEY = "sms_platform_token";

export const platformApi = axios.create({
  baseURL: `${baseURL}/platform`,
  headers: { "Content-Type": "application/json" },
});

platformApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function setPlatformToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(PLATFORM_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(PLATFORM_TOKEN_KEY);
  }
}
