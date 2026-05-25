import type { UseQueryResult } from "@tanstack/react-query";

export type AsyncStatus = "loading" | "error" | "empty" | "success";

export function queryStatus<T>(
  q: Pick<UseQueryResult<T>, "isPending" | "isError" | "isSuccess" | "data" | "error">,
  isEmpty?: (data: T) => boolean,
): AsyncStatus {
  if (q.isPending) return "loading";
  if (q.isError) return "error";
  if (q.isSuccess && q.data !== undefined && isEmpty?.(q.data)) return "empty";
  return "success";
}

/** Manual fetch state matching AsyncStatus (for legacy pages during migration). */
export function combineQueryStatus(
  queries: Array<Pick<UseQueryResult<unknown>, "isPending" | "isError" | "isSuccess">>,
  isEmpty?: () => boolean,
): AsyncStatus {
  if (queries.some((q) => q.isPending)) return "loading";
  if (queries.some((q) => q.isError)) return "error";
  if (isEmpty?.()) return "empty";
  if (queries.every((q) => q.isSuccess)) return "success";
  return "loading";
}

export function manualStatus({
  loading,
  error,
  data,
  isEmpty,
}: {
  loading: boolean;
  error?: unknown;
  data?: unknown;
  isEmpty?: (data: unknown) => boolean;
}): AsyncStatus {
  if (loading) return "loading";
  if (error) return "error";
  if (data !== undefined && isEmpty?.(data)) return "empty";
  return "success";
}
