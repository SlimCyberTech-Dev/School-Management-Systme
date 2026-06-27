"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";

type CbcFilters = {
  classId?: string;
  subjectId?: string;
  strandId?: string;
  termId?: string;
  yearId?: string;
};

const toQuery = (filters: Record<string, string | undefined>) => {
  const qp = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v) qp.set(k, v);
  });
  const s = qp.toString();
  return s ? `?${s}` : "";
};

export function useCbcAssessments(filters: CbcFilters) {
  return useQuery({
    queryKey: ["cbc-assessments", filters],
    queryFn: () => apiGet<unknown[]>(`/assessments/cbc${toQuery(filters)}`),
    enabled: Boolean(filters.termId && filters.yearId && filters.classId && filters.subjectId),
  });
}

export function useCbcActions() {
  const qc = useQueryClient();

  const unlock = useMutation({
    mutationFn: (payload: unknown) => apiPatch("/assessments/cbc/unlock", payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cbc-assessments"] }),
  });

  return { unlock };
}
