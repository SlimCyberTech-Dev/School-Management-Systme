"use client";

import { useIsFetching } from "@tanstack/react-query";

export function FetchingBar() {
  const fetching = useIsFetching();
  const active = fetching > 0;
  return (
    <div
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-0.5 overflow-hidden"
      aria-hidden={!active}
    >
      <div
        className={`h-full bg-brand transition-all duration-300 ${
          active ? "w-full animate-pulse opacity-100" : "w-0 opacity-0"
        }`}
        style={{
          transition: active ? undefined : "width 200ms ease-out, opacity 200ms",
        }}
      />
    </div>
  );
}
