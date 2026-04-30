import type { Role, UserPublic } from "@uganda-cbc-sms/shared";
import { create } from "zustand";
import { clearAuth, getStoredUser, getToken, setAuth } from "@/lib/auth";

type AuthState = {
  token: string | null;
  user: UserPublic | null;
  hydrated: boolean;
  setSession: (token: string, user: UserPublic) => void;
  logout: () => void;
  hydrate: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
};

function parseUser(u: unknown): UserPublic | null {
  if (!u || typeof u !== "object") return null;
  const o = u as Record<string, unknown>;
  if (
    typeof o.id === "string" &&
    typeof o.email === "string" &&
    typeof o.role === "string" &&
    typeof (o as { fullName?: string }).fullName === "string"
  ) {
    return o as unknown as UserPublic;
  }
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,
  setSession: (token, user) => {
    setAuth(token, JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    clearAuth();
    set({ token: null, user: null });
  },
  hydrate: () => {
    const t = getToken();
    const u = parseUser(getStoredUser());
    set({ token: t, user: u, hydrated: true });
  },
  hasRole: (roles) => {
    const { user } = get();
    if (!user) return false;
    const r = Array.isArray(roles) ? roles : [roles];
    return r.includes(user.role as Role);
  },
}));
