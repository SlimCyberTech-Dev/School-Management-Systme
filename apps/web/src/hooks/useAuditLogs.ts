"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AuditLogsArchiveInput,
  AuditLogsDeleteInput,
  AuditLogsListResponse,
  AuditLogsQuery,
  AuditLogStats,
} from "@uganda-cbc-sms/shared";
import { apiDelete, apiGet, apiPost } from "@/lib/api";

function toQueryString(filters: AuditLogsQuery): string {
  const qp = new URLSearchParams();
  qp.set("page", String(filters.page));
  qp.set("limit", String(filters.limit));
  qp.set("view", filters.view);
  if (filters.category) qp.set("category", filters.category);
  if (filters.severity) qp.set("severity", filters.severity);
  if (filters.outcome) qp.set("outcome", filters.outcome);
  if (filters.action) qp.set("action", filters.action);
  if (filters.actorId) qp.set("actorId", filters.actorId);
  if (filters.search) qp.set("search", filters.search);
  if (filters.from) qp.set("from", filters.from);
  if (filters.to) qp.set("to", filters.to);
  return qp.toString();
}

export function useAuditLogsList(filters: AuditLogsQuery) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => apiGet<AuditLogsListResponse>(`/audit-logs?${toQueryString(filters)}`),
  });
}

export function useAuditLogStats() {
  return useQuery({
    queryKey: ["audit-logs-stats"],
    queryFn: () => apiGet<AuditLogStats>("/audit-logs/stats"),
    staleTime: 30_000,
  });
}

export function useAuditLogMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["audit-logs"] });
    void qc.invalidateQueries({ queryKey: ["audit-logs-stats"] });
  };

  const archive = useMutation({
    mutationFn: (payload: AuditLogsArchiveInput) =>
      apiPost<{ archived: number }>("/audit-logs/archive", payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (payload: AuditLogsDeleteInput) =>
      apiDelete<{ deleted: number }>("/audit-logs", payload),
    onSuccess: invalidate,
  });

  return { archive, remove };
}
