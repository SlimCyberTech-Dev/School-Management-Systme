"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { CBC_RATING_OPTIONS, type CbcRating } from "@/lib/cbcRating";
import { apiPost } from "@/lib/api";

export type StudentRow = { id: string; fullName: string; studentNumber: string };

export function CbcScoreGrid({
  students,
  competencies,
  subjectId,
  strandId,
  termId,
}: {
  students: StudentRow[];
  competencies: string[];
  subjectId: string;
  strandId: string;
  termId: string;
}) {
  const key = (studentId: string, comp: string) => `${studentId}::${comp}`;
  const [ratings, setRatings] = useState<Record<string, CbcRating>>({});
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setErr(null);
    setLoading(true);
    try {
      const items = [];
      for (const s of students) {
        for (const c of competencies) {
          const r = ratings[key(s.id, c)];
          if (!r) continue;
          items.push({
            studentId: s.id,
            subjectId,
            strandId,
            termId,
            competency: c,
            rating: r,
          });
        }
      }
      if (items.length === 0) {
        setErr("Select at least one rating.");
        return;
      }
      await apiPost("/assessments/cbc", { items });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm text-destructive">{err}</p> : null}
      <div className="overflow-x-auto rounded border border-border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-2 py-2 text-left">Student</th>
              {competencies.map((c) => (
                <th key={c} className="px-2 py-2 text-left whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-2 py-2 whitespace-nowrap">
                  <div className="font-medium text-foreground">{s.fullName}</div>
                  <div className="text-xs text-muted-foreground">{s.studentNumber}</div>
                </td>
                {competencies.map((c) => (
                  <td key={c} className="px-2 py-1 align-top">
                    <Select
                      options={CBC_RATING_OPTIONS}
                      value={ratings[key(s.id, c)] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value as CbcRating | "";
                        setRatings((prev) => {
                          const next = { ...prev };
                          if (!v) delete next[key(s.id, c)];
                          else next[key(s.id, c)] = v;
                          return next;
                        });
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={() => void save()} loading={loading}>
        Save ratings
      </Button>
    </div>
  );
}
