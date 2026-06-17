"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiPost } from "@/lib/api";

export type AlevelStudent = { id: string; fullName: string; studentNumber: string };

export function ALevelScoreTable({
  students,
  subjectId,
  termId,
}: {
  students: AlevelStudent[];
  subjectId: string;
  termId: string;
}) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const saveAll = async () => {
    setErr(null);
    setLoading(true);
    try {
      for (const s of students) {
        const raw = scores[s.id];
        if (raw === undefined || raw === "") continue;
        const score = Number(raw);
        if (Number.isNaN(score)) continue;
        await apiPost("/assessments/alevel", {
          studentId: s.id,
          subjectId,
          termId,
          score,
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <div className="space-y-3">
        {students.map((s) => (
          <div key={s.id} className="grid grid-cols-1 gap-2 rounded border border-border p-3 md:grid-cols-3 md:items-end">
            <div>
              <div className="font-medium">{s.fullName}</div>
              <div className="text-xs text-slate-500">{s.studentNumber}</div>
            </div>
            <Input
              label="Score (0–100)"
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={scores[s.id] ?? ""}
              onChange={(e) =>
                setScores((prev) => ({
                  ...prev,
                  [s.id]: e.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>
      <Button onClick={() => void saveAll()} loading={loading}>
        Save scores
      </Button>
    </div>
  );
}
