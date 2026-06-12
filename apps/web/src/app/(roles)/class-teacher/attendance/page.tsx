"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  AttendanceRegisterTable,
  type AttendanceStatus,
} from "@/components/attendance/AttendanceRegisterTable";
import { TeacherLessonSlots } from "@/components/attendance/TeacherLessonSlots";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  useLessonAttendanceMutations,
  useLessonAttendanceRegister,
  type LessonRegisterResponse,
} from "@/hooks/useAttendanceLesson";
import { useMyTeachingScope } from "@/hooks/useMyTeachingScope";
import { mondayOfWeekIso, useTeacherWeek } from "@/hooks/useTimetable";
import type { TeacherWeekLesson } from "@uganda-cbc-sms/shared";
import { apiGet, apiPost, apiPut } from "@/lib/api";

type Tab = "lessons" | "homeroom";

type HomeroomRegisterResponse = {
  classId: string;
  className: string;
  classStream: string;
  date: string;
  registerId: string | null;
  registerStatus: "draft" | "submitted" | "locked";
  submittedAt: string | null;
  students: Array<{
    studentId: string;
    studentName: string;
    studentNumber: string;
    status: AttendanceStatus | null;
  }>;
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
  };
};

export default function ClassTeacherAttendancePage() {
  const searchParams = useSearchParams();
  const scope = useMyTeachingScope();

  const initialTab: Tab = searchParams.get("tab") === "homeroom" ? "homeroom" : "lessons";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [date, setDate] = useState(() => searchParams.get("date") ?? new Date().toISOString().slice(0, 10));
  const [selectedLesson, setSelectedLesson] = useState<TeacherWeekLesson | null>(null);

  const weekStart = useMemo(() => mondayOfWeekIso(new Date(`${date}T12:00:00`)), [date]);
  const weekQ = useTeacherWeek(weekStart);
  const lessonsForDate = useMemo(
    () => (weekQ.data?.lessons ?? []).filter((l) => l.date === date),
    [weekQ.data?.lessons, date],
  );

  useEffect(() => {
    const entryId = searchParams.get("timetableEntryId");
    const qDate = searchParams.get("date");
    if (!entryId) return;
    const match = (weekQ.data?.lessons ?? []).find(
      (l) => l.timetableEntryId === entryId && (!qDate || l.date === qDate),
    );
    if (match) {
      setSelectedLesson(match);
      setTab("lessons");
      if (qDate) setDate(qDate);
    }
  }, [searchParams, weekQ.data?.lessons]);

  const homeroomOptions = useMemo(
    () =>
      scope.attendanceClasses
        .filter((c) => c.isHomeroom)
        .map((c) => ({ value: c.classId, label: c.label })),
    [scope.attendanceClasses],
  );

  const hasHomeroom = homeroomOptions.length > 0;

  return (
    <PageWrapper
      title="Attendance"
      description="Mark attendance for each lesson from your published timetable, or use the homeroom register when needed."
    >
      <p className="-mt-4 mb-4 flex flex-wrap gap-4">
        <Link href="/class-teacher/timetable" className="text-sm font-medium text-brand hover:underline">
          View full timetable
        </Link>
        <Link href="/class-teacher/attendance/history" className="text-sm font-medium text-brand hover:underline">
          Attendance history
        </Link>
      </p>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-2">
        <TabButton active={tab === "lessons"} onClick={() => setTab("lessons")}>
          My lessons
        </TabButton>
        {hasHomeroom ? (
          <TabButton active={tab === "homeroom"} onClick={() => setTab("homeroom")}>
            Homeroom register
          </TabButton>
        ) : null}
      </div>

      {tab === "lessons" ? (
        <LessonAttendancePanel
          date={date}
          onDateChange={setDate}
          lessons={lessonsForDate}
          weekLoading={weekQ.isLoading}
          weekError={weekQ.error}
          onRefreshWeek={() => void weekQ.refetch()}
          selectedLesson={selectedLesson}
          onSelectLesson={setSelectedLesson}
          templatesUsed={weekQ.data?.templatesUsed ?? []}
        />
      ) : (
        <HomeroomAttendancePanel homeroomOptions={homeroomOptions} scopeLoading={scope.isLoading} />
      )}
    </PageWrapper>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-ui ${
        active ? "bg-brand text-white" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function LessonAttendancePanel({
  date,
  onDateChange,
  lessons,
  weekLoading,
  weekError,
  onRefreshWeek,
  selectedLesson,
  onSelectLesson,
  templatesUsed,
}: {
  date: string;
  onDateChange: (d: string) => void;
  lessons: TeacherWeekLesson[];
  weekLoading: boolean;
  weekError: Error | null;
  onRefreshWeek: () => void;
  selectedLesson: TeacherWeekLesson | null;
  onSelectLesson: (l: TeacherWeekLesson | null) => void;
  templatesUsed: Array<{ id: string; level: string; version: number }>;
}) {
  const entryId = selectedLesson?.timetableEntryId ?? "";
  const registerQ = useLessonAttendanceRegister(entryId, date);
  const mutations = useLessonAttendanceMutations(entryId, date);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const applyRegister = useCallback((data: LessonRegisterResponse) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const row of data.students) {
      next[row.studentId] = row.status ?? "present";
    }
    setStatuses(next);
  }, []);

  useEffect(() => {
    if (registerQ.data) applyRegister(registerQ.data);
  }, [registerQ.data, applyRegister]);

  const editable = !registerQ.data || registerQ.data.registerStatus === "draft";

  const buildRows = () =>
    (registerQ.data?.students ?? []).map((s) => ({
      studentId: s.studentId,
      status: statuses[s.studentId] ?? "present",
    }));

  const saveDraft = async () => {
    if (!entryId || !registerQ.data) return;
    setErr(null);
    setOk(null);
    try {
      const data = await mutations.save.mutateAsync({
        timetableEntryId: entryId,
        date,
        rows: buildRows(),
      });
      applyRegister(data);
      setOk("Lesson attendance draft saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const submitRegister = async () => {
    if (!entryId || !registerQ.data) return;
    setErr(null);
    setOk(null);
    try {
      await mutations.save.mutateAsync({
        timetableEntryId: entryId,
        date,
        rows: buildRows(),
      });
      const data = await mutations.submit.mutateAsync();
      applyRegister(data);
      setOk("Lesson attendance submitted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to submit");
    }
  };

  const totals = useMemo(() => {
    const students = registerQ.data?.students ?? [];
    let present = 0;
    let absent = 0;
    let late = 0;
    for (const row of students) {
      const status = statuses[row.studentId] ?? "present";
      if (status === "present") present += 1;
      else if (status === "absent") absent += 1;
      else late += 1;
    }
    return { total: students.length, present, absent, late };
  }, [registerQ.data?.students, statuses]);

  const attendanceRate =
    totals.total > 0 ? Math.round(((totals.present + totals.late) / totals.total) * 1000) / 10 : 0;

  return (
    <>
      {err ? <Alert tone="error">{err}</Alert> : null}
      {ok ? <Alert tone="success">{ok}</Alert> : null}
      {weekError ? (
        <Alert tone="error">{weekError instanceof Error ? weekError.message : "Failed to load timetable"}</Alert>
      ) : null}

      <Card title="Lessons for this date">
        <p className="mb-3 text-sm text-muted-foreground">
          Attendance is tied to your <strong>published</strong> timetable. When administrators update or
          republish the schedule, refresh to see the latest lessons.
          {templatesUsed.length
            ? ` · Schedule v${templatesUsed.map((t) => t.version).join(", v")}`
            : null}
        </p>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <Input label="Date" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
          </div>
          <Button type="button" variant="secondary" loading={weekLoading} onClick={onRefreshWeek}>
            Refresh schedule
          </Button>
        </div>
        {weekLoading && lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Loading lessons…</p>
        ) : (
          <TeacherLessonSlots
            lessons={lessons}
            selectedEntryId={selectedLesson?.timetableEntryId ?? null}
            onSelect={onSelectLesson}
          />
        )}
      </Card>

      {selectedLesson ? (
        <div className="mt-4">
          <Card
            title={`${selectedLesson.startTime}–${selectedLesson.endTime} · ${selectedLesson.subjectCode}`}
          >
            <p className="mb-3 text-sm text-muted-foreground">
              {selectedLesson.subjectName} · {selectedLesson.className}
              {selectedLesson.classStream ? ` ${selectedLesson.classStream}` : ""}
            </p>
            {registerQ.isLoading && !registerQ.data ? (
              <p className="text-sm text-muted-foreground">Loading register…</p>
            ) : registerQ.error ? (
              <Alert tone="error">
                {registerQ.error instanceof Error ? registerQ.error.message : "Failed to load register"}
              </Alert>
            ) : registerQ.data ? (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge tone={registerQ.data.registerStatus === "draft" ? "neutral" : "warning"}>
                    {registerQ.data.registerStatus}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {totals.total} learners · {totals.present} present · {totals.absent} absent ·{" "}
                    {totals.late} late · {attendanceRate}% rate
                  </span>
                </div>
                <AttendanceRegisterTable
                  students={registerQ.data.students}
                  statuses={statuses}
                  editable={editable}
                  registerStatus={registerQ.data.registerStatus}
                  submittedAt={registerQ.data.submittedAt}
                  saving={mutations.save.isPending}
                  submitting={mutations.submit.isPending}
                  onStatusChange={(id, s) => setStatuses((prev) => ({ ...prev, [id]: s }))}
                  onStatusesChange={setStatuses}
                  onSave={() => void saveDraft()}
                  onSubmit={() => void submitRegister()}
                />
              </>
            ) : null}
          </Card>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Select a lesson above to mark attendance.</p>
      )}
    </>
  );
}

function HomeroomAttendancePanel({
  homeroomOptions,
  scopeLoading,
}: {
  homeroomOptions: Array<{ value: string; label: string }>;
  scopeLoading: boolean;
}) {
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [register, setRegister] = useState<HomeroomRegisterResponse | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!classId && homeroomOptions[0]) setClassId(homeroomOptions[0].value);
  }, [classId, homeroomOptions]);

  const editable = register?.registerStatus === "draft" || !register;

  const applyRegister = useCallback((data: HomeroomRegisterResponse) => {
    setRegister(data);
    const next: Record<string, AttendanceStatus> = {};
    for (const row of data.students) {
      next[row.studentId] = row.status ?? "present";
    }
    setStatuses(next);
  }, []);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setErr(null);
    setOk(null);
    try {
      const r = await apiGet<HomeroomRegisterResponse>(
        `/attendance/register?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}`,
      );
      applyRegister(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load register");
    } finally {
      setLoading(false);
    }
  }, [applyRegister, classId, date]);

  useEffect(() => {
    if (classId) void load();
  }, [classId, date, load]);

  const buildRows = () =>
    (register?.students ?? []).map((s) => ({
      studentId: s.studentId,
      status: statuses[s.studentId] ?? "present",
    }));

  const saveDraft = async () => {
    if (!classId || !register || !editable) return;
    setSaving(true);
    setErr(null);
    try {
      const data = await apiPut<HomeroomRegisterResponse>("/attendance/register", {
        classId,
        date,
        rows: buildRows(),
      });
      applyRegister(data);
      setOk("Homeroom register saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const submitRegister = async () => {
    if (!classId || !register || !editable) return;
    setSubmitting(true);
    setErr(null);
    try {
      await apiPut("/attendance/register", { classId, date, rows: buildRows() });
      const data = await apiPost<HomeroomRegisterResponse>("/attendance/register/submit", { classId, date });
      applyRegister(data);
      setOk("Homeroom register submitted.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (!scopeLoading && homeroomOptions.length === 0) {
    return (
      <Alert tone="info">
        You do not have a homeroom class. Use the My lessons tab to mark attendance for each teaching
        period.
      </Alert>
    );
  }

  return (
    <>
      {err ? <Alert tone="error">{err}</Alert> : null}
      {ok ? <Alert tone="success">{ok}</Alert> : null}
      <Card title="Homeroom register">
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <Select
            label="Homeroom class"
            options={homeroomOptions}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button type="button" disabled={!classId} loading={loading} onClick={() => void load()}>
          Refresh
        </Button>
      </Card>
      {register ? (
        <div className="mt-4">
          <Card title="Mark homeroom attendance">
            <AttendanceRegisterTable
              students={register.students}
              statuses={statuses}
              editable={editable}
              registerStatus={register.registerStatus}
              submittedAt={register.submittedAt}
              saving={saving}
              submitting={submitting}
              onStatusChange={(id, s) => setStatuses((prev) => ({ ...prev, [id]: s }))}
              onStatusesChange={setStatuses}
              onSave={() => void saveDraft()}
              onSubmit={() => void submitRegister()}
            />
          </Card>
        </div>
      ) : loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
      ) : null}
    </>
  );
}
