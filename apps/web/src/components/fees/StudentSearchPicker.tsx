"use client";

import { useEffect, useMemo, useState } from "react";
import type { Student } from "@uganda-cbc-sms/shared";
import { Search } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Select } from "@/components/ui/Select";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { useClassEnrollmentSummary, useStudentsBrowse } from "@/hooks/useStudentsBrowse";
import { queryStatus } from "@/lib/queryStatus";

export type PickedStudent = Pick<Student, "id" | "fullName" | "studentNumber">;

function classOptionLabel(name: string, stream: string | null, active: number) {
  const label = stream ? `${name} · ${stream}` : name;
  return `${label} (${active})`;
}

export function StudentSearchPicker({
  selected,
  onSelect,
  label = "Find student",
}: {
  selected: PickedStudent | null;
  onSelect: (student: PickedStudent | null) => void;
  label?: string;
}) {
  const [classId, setClassId] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const summaryQ = useClassEnrollmentSummary();
  const classes = useMemo(
    () =>
      [...(summaryQ.data ?? [])].sort((a, b) =>
        `${a.className}${a.classStream}`.localeCompare(`${b.className}${b.classStream}`),
      ),
    [summaryQ.data],
  );

  useEffect(() => {
    if (classId || !classes.length) return;
    setClassId(classes[0]!.classId);
  }, [classes, classId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [classId, debouncedQ]);

  const browseEnabled = Boolean(classId) || debouncedQ.length >= 2;

  const browseQ = useStudentsBrowse(
    { page, limit, classId, status: "active", q: debouncedQ, sort: "name" },
    browseEnabled && !selected,
  );
  const status = queryStatus(browseQ);

  const selectedClass = useMemo(
    () => classes.find((c) => c.classId === classId) ?? null,
    [classes, classId],
  );

  if (selected) {
    return (
      <div className="space-y-3">
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Select
          label="Class"
          options={[
            { value: "", label: summaryQ.isLoading ? "Loading classes…" : "All classes (search required)" },
            ...classes.map((c) => ({
              value: c.classId,
              label: classOptionLabel(c.className, c.classStream, c.activeCount),
            })),
          ]}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          disabled={summaryQ.isLoading}
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">{label}</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name or student number…"
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>
      </div>

      {!classId && debouncedQ.length < 2 ? (
        <Alert tone="info">
          Select a class to browse learners, or type at least 2 characters to search across all classes.
        </Alert>
      ) : null}

      {summaryQ.isError ? (
        <Alert tone="error">Could not load classes. Refresh the page and try again.</Alert>
      ) : null}

      {browseEnabled ? (
        <div className="rounded-md border border-border">
          {status === "loading" && !browseQ.data ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Loading students…</p>
          ) : status === "error" ? (
            <Alert tone="error">Could not load students. Try again.</Alert>
          ) : (browseQ.data?.items.length ?? 0) === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No active students match your filters.
            </p>
          ) : (
            <>
              {selectedClass ? (
                <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                  {selectedClass.activeCount} active learner(s) in{" "}
                  {classOptionLabel(selectedClass.className, selectedClass.classStream, selectedClass.activeCount)}
                </p>
              ) : null}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left" scope="col" />
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">
                        Student #
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">
                        Name
                      </th>
                      {!classId ? (
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground" scope="col">
                          Class
                        </th>
                      ) : null}
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground" scope="col">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {browseQ.data!.items.map((s) => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <StudentAvatar fullName={s.fullName} photoUrl={s.photoUrl} size="sm" />
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">{s.studentNumber}</td>
                        <td className="px-3 py-2 font-medium">{s.fullName}</td>
                        {!classId ? (
                          <td className="px-3 py-2 text-muted-foreground">
                            {[s.className, s.classStream].filter(Boolean).join(" · ") || "—"}
                          </td>
                        ) : null}
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="secondary"
                            className="!px-2 !py-1 text-xs"
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
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {browseQ.data ? (
                <div className="px-3 pb-3">
                  <PaginationBar
                    page={browseQ.data.page}
                    totalPages={browseQ.data.totalPages}
                    total={browseQ.data.total}
                    limit={browseQ.data.limit}
                    onPageChange={setPage}
                    onLimitChange={(n) => {
                      setLimit(n);
                      setPage(1);
                    }}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
