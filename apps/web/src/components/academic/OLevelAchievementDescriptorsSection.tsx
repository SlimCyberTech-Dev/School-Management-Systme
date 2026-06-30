"use client";

import { CBC_RATINGS, type CbcRating } from "@uganda-cbc-sms/shared";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

type ScaleRow = {
  grade: string;
  descriptor?: string | null;
  minScore: number;
  maxScore: number;
  sortOrder: number;
  isActive: boolean;
};

/**
 * Descriptor-only editor for UNEB A–E achievement labels (shared with formative UI and report cards).
 * Letters and rank order are fixed; composite score bands are edited in the main table above.
 */
export function OLevelAchievementDescriptorsSection({
  rows,
  onDescriptorChange,
}: {
  rows: ScaleRow[];
  onDescriptorChange: (grade: CbcRating, descriptor: string) => void;
}) {
  const byGrade = Object.fromEntries(
    CBC_RATINGS.map((g) => {
      const row = rows.find((r) => r.grade.toUpperCase() === g);
      return [g, row];
    }),
  ) as Record<CbcRating, ScaleRow | undefined>;

  return (
    <Card title="Achievement level descriptors (A–E)">
      <div className="mb-4">
        <Alert tone="info">
          These labels appear on formative competency ratings, term summaries, and report card strand
          lines. Letter grades and rank order (A highest → E lowest) are fixed for UNEB compliance;
          only the descriptor wording is configurable per school.
        </Alert>
      </div>
      <div className="overflow-x-auto rounded border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-3 py-2 text-left">Grade</th>
              <th className="px-3 py-2 text-left">Descriptor (school wording)</th>
            </tr>
          </thead>
          <tbody>
            {CBC_RATINGS.map((grade) => (
              <tr key={grade} className="border-t border-border">
                <td className="px-3 py-2 font-semibold">{grade}</td>
                <td className="px-3 py-2">
                  <input
                    value={byGrade[grade]?.descriptor ?? ""}
                    onChange={(e) => onDescriptorChange(grade, e.target.value)}
                    placeholder={`UNEB default for ${grade}`}
                    className="w-full max-w-md rounded border border-border bg-background px-2 py-1.5"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
