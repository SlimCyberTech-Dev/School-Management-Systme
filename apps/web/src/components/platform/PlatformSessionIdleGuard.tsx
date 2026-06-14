"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { sessionInactivityMs } from "@/lib/sessionConfig";
import { usePlatformStore } from "@/store/platformStore";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;

/**
 * Signs the platform operator out after local inactivity.
 * Server-side idle timeout is enforced on each authenticated API request.
 */
export function PlatformSessionIdleGuard() {
  const router = useRouter();
  const isAuthenticated = usePlatformStore((s) => s.isAuthenticated);
  const idleExpiresAt = usePlatformStore((s) => s.idleExpiresAt);
  const bumpIdleExpiry = usePlatformStore((s) => s.bumpIdleExpiry);
  const logoutRemote = usePlatformStore((s) => s.logoutRemote);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityMs = sessionInactivityMs();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleExpiry = useCallback(() => {
    clearTimer();
    if (!usePlatformStore.getState().isAuthenticated) return;

    const deadline = usePlatformStore.getState().idleExpiresAt ?? Date.now() + inactivityMs;
    const delay = Math.max(0, deadline - Date.now());
    timerRef.current = setTimeout(() => {
      void (async () => {
        await logoutRemote();
        if (window.location.pathname !== "/platform/login") {
          router.replace("/platform/login?reason=timeout");
        }
      })();
    }, delay);
  }, [clearTimer, inactivityMs, logoutRemote, router]);

  const onActivity = useCallback(() => {
    if (!usePlatformStore.getState().isAuthenticated) return;
    bumpIdleExpiry(inactivityMs);
    scheduleExpiry();
  }, [bumpIdleExpiry, inactivityMs, scheduleExpiry]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimer();
      return;
    }

    if (idleExpiresAt == null) {
      bumpIdleExpiry(inactivityMs);
    }

    scheduleExpiry();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    const onVisibility = () => {
      if (document.visibilityState === "visible") onActivity();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimer();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    isAuthenticated,
    idleExpiresAt,
    bumpIdleExpiry,
    inactivityMs,
    onActivity,
    scheduleExpiry,
    clearTimer,
  ]);

  return null;
}
