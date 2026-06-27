"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NormalizedCompetency } from "@/lib/cbcCompetency";
import { normalizeCompetencyName } from "@/lib/cbcCompetency";
import { useCbcTermSummary } from "@/hooks/useCbcCompetencyApi";
import { apiGet } from "@/lib/api";

type StrandRow = {
  id: string;
  name: string;
  subStrands?: { id: string; name: string }[];
  competencies?: string[];
};

/**
 * Resolves cbc_competencies UUIDs by combining strand metadata with term-summary rows.
 * Gap: no dedicated GET /competencies — IDs come from term-summary when any rating exists.
 */
export function useCbcCompetencyCatalog(input: {
  subjectId: string;
  termId: string;
  sampleStudentId?: string;
  enabled?: boolean;
}) {
  const strandsQ = useQuery({
    queryKey: ["assessment-strands", input.subjectId],
    queryFn: () =>
      apiGet<StrandRow[]>(`/assessments/strands?subjectId=${encodeURIComponent(input.subjectId)}`),
    enabled: Boolean(input.subjectId) && (input.enabled ?? true),
  });

  const summaryQ = useCbcTermSummary({
    studentId: input.sampleStudentId,
    subjectId: input.subjectId,
    termId: input.termId,
  });

  const catalog = useMemo(() => {
    const byName = new Map<string, NormalizedCompetency>();
    for (const row of summaryQ.data ?? []) {
      if (!row.competency_id || !row.competency_name) continue;
      const key = normalizeCompetencyName(row.competency_name);
      if (!byName.has(key)) {
        byName.set(key, {
          id: row.competency_id,
          name: row.competency_name,
          strandId: "",
        });
      }
    }

    const strands = (strandsQ.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      competencies: s.subStrands?.length
        ? s.subStrands.map((x) => x.name)
        : (s.competencies ?? []).filter((c): c is string => typeof c === "string" && c.length > 0),
    }));

    const resolved: NormalizedCompetency[] = [];
    for (const strand of strands) {
      for (const compName of strand.competencies) {
        const hit = byName.get(normalizeCompetencyName(compName));
        if (hit) {
          resolved.push({ ...hit, name: compName, strandId: strand.id });
        }
      }
    }

    return { strands, resolved, idByName: byName };
  }, [strandsQ.data, summaryQ.data]);

  const needsSummarySeed =
    catalog.resolved.length === 0 &&
    (strandsQ.data?.some((s) => (s.subStrands?.length ?? 0) > 0 || (s.competencies?.length ?? 0) > 0) ?? false);

  return {
    ...catalog,
    isLoading: strandsQ.isLoading || (Boolean(input.sampleStudentId) && summaryQ.isLoading),
    error: strandsQ.error ?? summaryQ.error,
    refetch: () => {
      void strandsQ.refetch();
      void summaryQ.refetch();
    },
    needsSummarySeed,
    hasSummaryData: (summaryQ.data?.length ?? 0) > 0,
  };
}
