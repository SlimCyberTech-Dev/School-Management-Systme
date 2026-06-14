import { create } from "zustand";
import {
  deletePlatformTokenCookie,
  getPlatformTokenFromCookie,
  setPlatformTokenCookie,
} from "@/lib/cookies";
import { jwtCookieMaxAge } from "@/lib/jwtPayload";
import { isValidPlatformToken } from "@/lib/platformSession";
import { sessionInactivityMs } from "@/lib/sessionConfig";

export type PlatformAdmin = {
  id: string;
  email: string;
  fullName: string;
  lastLoginAt?: string | null;
};

export type PlatformSessionInfo = {
  inactivityMinutes: number;
  idleExpiresAt: string;
};

type PlatformState = {
  admin: PlatformAdmin | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  idleExpiresAt: number | null;
  login: (admin: PlatformAdmin, token: string, session?: PlatformSessionInfo) => void;
  logout: () => void;
  logoutRemote: () => Promise<void>;
  hydrate: () => Promise<void>;
  setToken: (token: string | null, session?: PlatformSessionInfo) => void;
  setIdleExpiresAt: (unixMs: number) => void;
  bumpIdleExpiry: (inactivityMs: number) => void;
  updateAdmin: (patch: Partial<PlatformAdmin>) => void;
};

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function idleDeadlineFromSession(session?: PlatformSessionInfo): number | null {
  if (!session?.idleExpiresAt) return null;
  const ms = Date.parse(session.idleExpiresAt);
  return Number.isFinite(ms) ? ms : null;
}

function parseAdmin(data: unknown): PlatformAdmin | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (
    typeof o.id === "string" &&
    typeof o.email === "string" &&
    typeof o.fullName === "string"
  ) {
    return {
      id: o.id,
      email: o.email,
      fullName: o.fullName,
      lastLoginAt: typeof o.lastLoginAt === "string" ? o.lastLoginAt : null,
    };
  }
  return null;
}

export const usePlatformStore = create<PlatformState>((set, get) => ({
  admin: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,
  idleExpiresAt: null,

  setIdleExpiresAt: (unixMs) => set({ idleExpiresAt: unixMs }),

  bumpIdleExpiry: (inactivityMs) =>
    set({ idleExpiresAt: Date.now() + inactivityMs }),

  updateAdmin: (patch) =>
    set((state) => ({
      admin: state.admin ? { ...state.admin, ...patch } : null,
    })),

  setToken: (token, session) => {
    if (token && isValidPlatformToken(token)) {
      setPlatformTokenCookie(token, jwtCookieMaxAge(token));
    } else {
      deletePlatformTokenCookie();
    }
    set({
      token: token && isValidPlatformToken(token) ? token : null,
      isAuthenticated: Boolean(token && isValidPlatformToken(token)),
      idleExpiresAt:
        idleDeadlineFromSession(session) ?? Date.now() + sessionInactivityMs(),
    });
  },

  login: (admin, token, session) => {
    setPlatformTokenCookie(token, jwtCookieMaxAge(token));
    set({
      admin,
      token,
      isAuthenticated: true,
      hydrated: true,
      idleExpiresAt:
        idleDeadlineFromSession(session) ?? Date.now() + sessionInactivityMs(),
    });
  },

  logout: () => {
    deletePlatformTokenCookie();
    set({
      admin: null,
      token: null,
      isAuthenticated: false,
      hydrated: true,
      idleExpiresAt: null,
    });
  },

  logoutRemote: async () => {
    const token = get().token ?? getPlatformTokenFromCookie();
    if (token) {
      try {
        await fetch(`${baseUrl.replace(/\/$/, "")}/platform/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        /* best-effort */
      }
    }
    get().logout();
  },

  hydrate: async () => {
    const token = getPlatformTokenFromCookie();
    if (!token || !isValidPlatformToken(token)) {
      deletePlatformTokenCookie();
      set({
        admin: null,
        token: null,
        isAuthenticated: false,
        hydrated: true,
        idleExpiresAt: null,
      });
      return;
    }

    set({ token, isAuthenticated: true });

    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/platform/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        get().logout();
        return;
      }
      const json = (await res.json()) as { data?: unknown };
      const admin = parseAdmin(json.data);
      const idleHeader = res.headers.get("x-session-idle-expires-at");
      const idleUnix = idleHeader ? Number(idleHeader) : NaN;
      if (!admin) {
        get().logout();
        return;
      }
      set({
        admin,
        token,
        isAuthenticated: true,
        hydrated: true,
        idleExpiresAt: Number.isFinite(idleUnix)
          ? idleUnix * 1000
          : Date.now() + sessionInactivityMs(),
      });
    } catch {
      get().logout();
    }
  },
}));
