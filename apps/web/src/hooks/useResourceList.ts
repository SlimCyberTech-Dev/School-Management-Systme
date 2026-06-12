"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export function useResourceList<T>(queryKey: string[], path: string, enabled = true) {
  return useQuery({
    queryKey,
    queryFn: () => apiGet<T>(path),
    enabled,
  });
}
