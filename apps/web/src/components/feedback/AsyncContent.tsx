"use client";

import type { ReactNode } from "react";
import { Spinner } from "@/components/feedback/Spinner";
import type { AsyncStatus } from "@/lib/queryStatus";

export function AsyncContent({
  status,
  loading,
  error,
  empty,
  children,
  isFetching = false,
  className = "",
}: {
  status: AsyncStatus;
  loading: ReactNode;
  error: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
  /** Background refetch while stale data is shown */
  isFetching?: boolean;
  className?: string;
}) {
  if (status === "loading") return <>{loading}</>;
  if (status === "error") return <>{error}</>;
  if (status === "empty" && empty) return <>{empty}</>;

  return (
    <div className={`relative ${className}`}>
      {isFetching ? (
        <div
          className="pointer-events-none absolute right-0 top-0 z-10 flex items-center justify-center rounded-md bg-card/80 p-2"
          aria-live="polite"
          aria-busy="true"
        >
          <Spinner size="sm" />
        </div>
      ) : null}
      <div className={isFetching ? "pointer-events-none opacity-60 transition-opacity" : undefined}>{children}</div>
    </div>
  );
}
