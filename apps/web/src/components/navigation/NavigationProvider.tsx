"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";

type NavigationContextValue = {
  /** True during route change and/or initial data fetch for the new page */
  isNavigating: boolean;
  /** Call when the user starts navigation (e.g. sidebar click) */
  startNavigation: () => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigationLoading() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    return { isNavigating: false, startNavigation: () => {} };
  }
  return ctx;
}

const MIN_VISIBLE_MS = 280;
const MAX_NAV_MS = 12_000;

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFetching = useIsFetching();

  const [pending, setPending] = useState(false);
  const pendingSince = useRef<number | null>(null);
  const isFirstRoute = useRef(true);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (completeTimer.current) clearTimeout(completeTimer.current);
    if (maxTimer.current) clearTimeout(maxTimer.current);
    completeTimer.current = null;
    maxTimer.current = null;
  }, []);

  const startNavigation = useCallback(() => {
    clearTimers();
    pendingSince.current = Date.now();
    setPending(true);
    maxTimer.current = setTimeout(() => {
      setPending(false);
      pendingSince.current = null;
    }, MAX_NAV_MS);
  }, [clearTimers]);

  const tryComplete = useCallback(() => {
    if (!pendingSince.current) return;
    const elapsed = Date.now() - pendingSince.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    completeTimer.current = setTimeout(() => {
      setPending(false);
      pendingSince.current = null;
      clearTimers();
    }, remaining);
  }, [clearTimers]);

  useEffect(() => {
    if (isFirstRoute.current) {
      isFirstRoute.current = false;
      return;
    }
    startNavigation();
  }, [pathname, startNavigation]);

  useEffect(() => {
    if (!pending) return;
    if (isFetching === 0) {
      tryComplete();
    }
  }, [pending, isFetching, tryComplete]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const isNavigating = pending;

  const value = useMemo(
    () => ({ isNavigating, startNavigation }),
    [isNavigating, startNavigation],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
