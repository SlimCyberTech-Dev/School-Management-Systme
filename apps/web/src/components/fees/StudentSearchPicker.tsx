"use client";

import { useEffect, useState } from "react";
import type { Student } from "@uganda-cbc-sms/shared";
import { Search } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { useStudentsBrowse } from "@/hooks/useStudentsBrowse";
import { queryStatus } from "@/lib/queryStatus";

export type PickedStudent = Pick<Student, "id" | "fullName" | "studentNumber">;

export function StudentSearchPicker({
  selected,
  onSelect,
  label = "Find student",
}: {
  selected: PickedStudent | null;
  onSelect: (student: PickedStudent | null) => void;
  label?: string;
}) {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const browseQ = useStudentsBrowse(
    { page: 1, limit: 10, classId: "", status: "active", q: debouncedQ, sort: "name" },
    debouncedQ.length >= 2,
  );
  const status = queryStatus(browseQ);

  return (
    <div className="space-y-3">
      <Input
        label={label}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Name or student number (min. 2 characters)"
      />
      {selected ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          <span>
            <span className="font-medium text-foreground">{selected.fullName}</span>
            <span className="ml-2 text-muted-foreground">#{selected.studentNumber}</span>
          </span>
          <button
            type="button"
            className="text-xs font-medium text-brand underline-offset-2 hover:underline"
            onClick={() => onSelect(null)}
          >
            Change student
          </button>
        </div>
      ) : null}
      {!selected && debouncedQ.length >= 2 ? (
        <div className="rounded-md border border-border">
          {status === "loading" ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
          ) : status === "error" ? (
            <Alert tone="error">Could not search students. Try again.</Alert>
          ) : (browseQ.data?.items.length ?? 0) === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No students match your search.</p>
          ) : (
            <ul className="divide-y divide-border">
              {browseQ.data!.items.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-ui hover:bg-accent/50"
                    onClick={() => {
                      onSelect({
                        id: s.id,
                        fullName: s.fullName,
                        studentNumber: s.studentNumber,
                      });
                      setQ("");
                      setDebouncedQ("");
                    }}
                  >
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{s.fullName}</span>
                    <span className="text-muted-foreground">#{s.studentNumber}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : !selected ? (
        <p className="text-xs text-muted-foreground">Search by name or student number to select a learner.</p>
      ) : null}
    </div>
  );
}
