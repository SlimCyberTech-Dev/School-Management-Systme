"use client";

import { useIsFetching } from "@tanstack/react-query";
import { useNavigationLoading } from "./NavigationProvider";

/** Global top progress: indeterminate on route change, subtle bar on background refetch */
export function RouteProgressBar() {
  const { isNavigating } = useNavigationLoading();
  const fetchingCount = useIsFetching();
  const showNav = isNavigating;
  const showFetch = !showNav && fetchingCount > 0;

  if (!showNav && !showFetch) {
    return (
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-[110] h-[3px]" aria-hidden />
    );
  }

  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[110] h-[3px] overflow-hidden bg-brand/10"
      aria-live="polite"
      aria-busy
    >
      {showNav ? (
        <div className="route-progress-bar h-full bg-brand shadow-[0_0_10px_rgba(27,107,58,0.35)]" />
      ) : (
        <div className="h-full w-2/5 animate-pulse bg-brand/80" />
      )}
    </div>
  );
}
