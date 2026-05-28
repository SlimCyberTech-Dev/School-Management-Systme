"use client";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Row = {
  subject_id?: string;
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string | null;
  status?: string;
};

function statusTone(status: string): "success" | "warning" | "neutral" {
  if (status === "Submitted") return "success";
  if (status === "Draft") return "warning";
  return "neutral";
}

export function AssessmentStatusOverview({
  rows,
  canUnlock,
  onUnlock,
}: {
  rows: Row[];
  canUnlock?: boolean;
  onUnlock?: (subjectId: string) => Promise<void>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-card shadow-sm">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subject
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Teacher
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const status = row.status ?? "Draft";
            const submitted = status === "Submitted";
            return (
              <tr key={row.subject_id ?? `${row.subject_code}-${row.subject_name}`} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  <span className="text-muted-foreground">{row.subject_code}</span> {row.subject_name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.teacher_name ?? "Unassigned"}</td>
                <td className="px-4 py-3">
                  <Badge tone={statusTone(status)}>{status}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {canUnlock && row.subject_id && submitted ? (
                    <Button variant="secondary" onClick={() => void onUnlock?.(row.subject_id!)}>
                      Unlock
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">{submitted ? "—" : "Not submitted"}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
