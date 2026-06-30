import {
  assignCompetitionRanks,
  type RankableStudent,
  type RankingMethod,
  type ReportRankingSnapshot,
} from "@uganda-cbc-sms/shared";
import type { AlevelReportPayload, CbcReportPayload, ReportTrack } from "./reportTypes";

function lowerIsBetterForMethod(method: RankingMethod): boolean {
  return method === "alevel_best3_points";
}

export function rankableFromAlevelPayload(
  studentId: string,
  payload: AlevelReportPayload,
): RankableStudent | null {
  const points = payload.subjects.map((s) => s.points).filter((p) => !Number.isNaN(p));
  if (points.length < 3) return null;
  const best3 = [...points].sort((a, b) => a - b).slice(0, 3);
  const aggregate = best3.reduce((s, p) => s + p, 0);
  return {
    studentId,
    sortKey: aggregate,
    aggregateValue: aggregate,
    aggregateLabel: `Best 3: ${aggregate} pts · Division ${payload.division}`,
    method: "alevel_best3_points",
    subjectsCounted: best3.length,
  };
}

export function rankableFromCbcPayload(
  studentId: string,
  payload: CbcReportPayload,
): RankableStudent | null {
  const termRows = payload.termSubjectRows ?? [];
  const averages = termRows
    .map((s) => s.average)
    .filter((a): a is number => a != null && !Number.isNaN(a));
  if (averages.length >= 1) {
    const avg =
      payload.overallAverage ??
      Math.round((averages.reduce((s, c) => s + c, 0) / averages.length) * 10) / 10;
    return {
      studentId,
      sortKey: avg,
      aggregateValue: avg,
      aggregateLabel: `Term average ${avg}% (${averages.length} subjects)`,
      method: "olevel_composite_average",
      subjectsCounted: averages.length,
    };
  }

  return null;
}

export type CompiledReportEntry =
  | { studentId: string; track: "alevel"; payload: AlevelReportPayload }
  | { studentId: string; track: "cbc"; payload: CbcReportPayload };

export function attachClassRankings(entries: CompiledReportEntry[]): CompiledReportEntry[] {
  if (entries.length === 0) return entries;

  const track = entries[0]!.track;
  const rankables: RankableStudent[] = [];

  for (const entry of entries) {
    const row =
      entry.track === "alevel"
        ? rankableFromAlevelPayload(entry.studentId, entry.payload)
        : rankableFromCbcPayload(entry.studentId, entry.payload);
    if (row) rankables.push(row);
  }

  const method = rankables[0]?.method ?? (track === "alevel" ? "alevel_best3_points" : "olevel_composite_average");
  const lowerIsBetter = lowerIsBetterForMethod(method);
  const rankMap = assignCompetitionRanks(rankables, lowerIsBetter);

  return entries.map((entry) => {
    const ranking = rankMap.get(entry.studentId);
    if (entry.track === "alevel") {
      return { ...entry, payload: { ...entry.payload, ranking } };
    }
    return { ...entry, payload: { ...entry.payload, ranking } };
  });
}

export function listClassRankingLeaderboard(
  entries: CompiledReportEntry[],
): Array<{
  studentId: string;
  studentName: string;
  studentNumber: string;
  ranking: ReportRankingSnapshot | null;
  division?: string | null;
  totalPoints?: number | null;
  certificationLabel?: string | null;
}> {
  const withMeta = entries.map((e) => {
    const base = {
      studentId: e.studentId,
      studentName: e.payload.studentName,
      studentNumber: e.payload.studentNumber,
      ranking: e.payload.ranking ?? null,
    };
    if (e.track === "alevel") {
      return { ...base, division: e.payload.division, totalPoints: e.payload.totalPoints };
    }
    return {
      ...base,
      certificationLabel: e.payload.certification?.label ?? null,
    };
  });

  return withMeta.sort((a, b) => {
    const pa = a.ranking?.position ?? 9999;
    const pb = b.ranking?.position ?? 9999;
    if (pa !== pb) return pa - pb;
    return a.studentName.localeCompare(b.studentName);
  });
}
