"use client";

import { useEffect, useMemo, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useMyTeachingScope } from "@/hooks/useMyTeachingScope";
import { apiGet, apiPost } from "@/lib/api";
import { classDisplayName } from "@/lib/academicLevel";

type AttRow = {
  student_id?: string;
  student_name?: string;
  student_number?: string;
  status?: string;
};

export default function ClassTeacherAttendancePage() {
  const scope = useMyTeachingScope();
  const homeroomOptions = useMemo(
    () =>
      scope.homeroomClasses.map((c) => ({
        value: c.classId,
        label: classDisplayName({ name: c.className, stream: c.classStream }),
      })),
    [scope.homeroomClasses],
  );

  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<AttRow[]>([]);
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<"present" | "absent" | "late">("present");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classId && homeroomOptions[0]) {
      setClassId(homeroomOptions[0].value);
    }
  }, [classId, homeroomOptions]);

  const load = async () => {
    if (!classId) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await apiGet<AttRow[]>(
        `/attendance?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}`,
      );
      setRows(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load register");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!classId || !studentId) return;
    setErr(null);
    try {
      await apiPost("/attendance", { studentId, classId, date, status });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    }
  };

  return (
    <PageWrapper title="Attendance" description="Daily register for your homeroom class">
      {err ? <Alert tone="error">{err}</Alert> : null}
      {scope.homeroomClasses.length === 0 && !scope.isLoading ? (
        <Alert tone="info">
          No homeroom class is assigned to you for {scope.activeYear?.name ?? "this year"}. Ask an administrator to
          set your class teacher assignment.
        </Alert>
      ) : null}
      <Card title="Register">
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <Select
            label="Homeroom class"
            options={homeroomOptions}
            value={classId}
            disabled={homeroomOptions.length === 0}
            onChange={(e) => setClassId(e.target.value)}
          />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button type="button" disabled={!classId} onClick={() => void load()}>
          {loading ? "Loading…" : "Load register"}
        </Button>
      </Card>
      <div className="mt-4">
      <Card title="Mark attendance">
        <div className="grid gap-3 md:grid-cols-3">
          <Input label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          <Select
            label="Status"
            options={[
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
              { value: "late", label: "Late" },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          />
          <div className="flex items-end">
            <Button type="button" disabled={!classId || !studentId} onClick={() => void save()}>
              Save mark
            </Button>
          </div>
        </div>
        {rows.length > 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{rows.length} row(s) loaded for this date.</p>
        ) : null}
      </Card>
      </div>
    </PageWrapper>
  );
}
