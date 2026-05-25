"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { queryStatus } from "@/lib/queryStatus";

export function useEntityDetail<T>(resource: string, id: string) {
  const q = useQuery({
    queryKey: [resource, id],
    queryFn: () => apiGet<T>(`${resource}/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });
  const status = queryStatus(q, () => false);
  const notFound = q.isError && !q.isPending;
  return { ...q, status, notFound };
}
