"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Clock,
  ClipboardCheck,
  RefreshCw,
  Users,
} from "lucide-react";
import type { TeacherWeekLesson, TeacherWeekView } from "@uganda-cbc-sms/shared";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { classDisplayName } from "@/lib/academicLevel";
import { mondayOfWeekIso } from "@/hooks/useTimetable";

const DAY_LABELS = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function teacherBasePath(pathname: string): string {
  if (pathname.startsWith("/subject-teacher")) return "/subject-teacher";
  return "/class-teacher";
}

function shiftWeekStart(weekStart: string | undefined, deltaWeeks: number): string {
  const monday = weekStart
    ? new Date(`${weekStart}T12:00:00`)
    : new Date(`${mondayOfWeekIso()}T12:00:00`);
  monday.setDate(monday.getDate() + deltaWeeks * 7);
  return monday.toISOString().slice(0, 10);
}

function formatDayDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(`${weekStart}T12:00:00`);
  const end = new Date(`${weekEnd}T12:00:00`);
  const opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric" };
  const year =
    start.getFullYear() === end.getFullYear() ? start.getFullYear() : `${start.getFullYear()}–${end.getFullYear()}`;
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}, ${year}`;
}

function attendanceTone(status: TeacherWeekLesson["attendanceStatus"]) {
  if (status === "submitted" || status === "locked") return "success" as const;
  if (status === "draft") return "warning" as const;
  return "neutral" as const;
}

function attendanceLabel(status: TeacherWeekLesson["attendanceStatus"]) {
  if (status === "submitted" || status === "locked") return "Done";
  if (status === "draft") return "Draft";
  return "Pending";
}

type Props = {
  week: TeacherWeekView | undefined;
  weekStart?: string;
  onWeekStartChange?: (next: string | undefined) => void;
  onRefresh?: () => void;
  isFetching?: boolean;
};

export function TeacherWeekTimetable({
  week,
  weekStart,
  onWeekStartChange,
  onRefresh,
  isFetching,
}: Props) {
  const base = teacherBasePath(usePathname());
  const todayIso = new Date().toISOString().slice(0, 10);
  const currentMonday = week?.weekStart ?? weekStart ?? mondayOfWeekIso();

  const stats = useMemo(() => {
    const lessons = week?.lessons ?? [];
    const total = lessons.length;
    const done = lessons.filter(
      (l) => l.attendanceStatus === "submitted" || l.attendanceStatus === "locked",
    ).length;
    const draft = lessons.filter((l) => l.attendanceStatus === "draft").length;
    const pending = total - done - draft;
    const todayCount = lessons.filter((l) => l.date === todayIso).length;
    return { total, done, draft, pending, todayCount };
  }, [week?.lessons, todayIso]);

  const byDay = useMemo(() => {
    const map = new Map<number, TeacherWeekLesson[]>();
    for (const lesson of week?.lessons ?? []) {
      const list = map.get(lesson.dayOfWeek) ?? [];
      list.push(lesson);
      map.set(lesson.dayOfWeek, list);
    }
    for (const [day, list] of map) {
      map.set(
        day,
        [...list].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.periodNumber - b.periodNumber),
      );
    }
    return map;
  }, [week?.lessons]);

  if (!week) {
    return null;
  }

  if (week.lessons.length === 0) {
    return (
      <div className="space-y-6">
        <TimetableToolbar
          weekLabel={formatWeekRange(week.weekStart, week.weekEnd)}
          templatesUsed={week.templatesUsed}
          currentMonday={currentMonday}
          weekStart={weekStart}
          onWeekStartChange={onWeekStartChange}
          onRefresh={onRefresh}
          isFetching={isFetching}
          base={base}
        />
        <div className="rounded-xl border border-dashed border-border bg-card/50">
          <EmptyState
            icon={CalendarDays}
            title="No timetable published yet"
            description="When your school publishes the term schedule, your lessons will appear here with times and classes."
            action={
              onRefresh
                ? { label: "Check again", onClick: onRefresh }
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TimetableToolbar
        weekLabel={formatWeekRange(week.weekStart, week.weekEnd)}
        templatesUsed={week.templatesUsed}
        currentMonday={currentMonday}
        weekStart={weekStart}
        onWeekStartChange={onWeekStartChange}
        onRefresh={onRefresh}
        isFetching={isFetching}
        base={base}
      />

      <div className="flex flex-wrap gap-2">
        <StatPill icon={CalendarDays} label="This week" value={String(stats.total)} sub="lessons" />
        <StatPill
          icon={CheckCircle2}
          label="Attendance"
          value={String(stats.done)}
          sub="submitted"
          tone="success"
        />
        {stats.draft > 0 ? (
          <StatPill icon={CircleDashed} label="Drafts" value={String(stats.draft)} sub="saved" tone="warning" />
        ) : null}
        {stats.pending > 0 ? (
          <StatPill icon={ClipboardCheck} label="To mark" value={String(stats.pending)} sub="pending" />
        ) : null}
        {stats.todayCount > 0 ? (
          <StatPill icon={Clock} label="Today" value={String(stats.todayCount)} sub="lessons" highlight />
        ) : null}
      </div>

      <div className="-mx-1 overflow-x-auto pb-2 lg:mx-0 lg:overflow-visible">
        <div className="grid min-w-[min(100%,56rem)] grid-cols-5 gap-3 px-1 lg:min-w-0 lg:gap-4">
          {[1, 2, 3, 4, 5].map((day) => {
            const lessons = byDay.get(day) ?? [];
            const dayDate = lessons[0]?.date ?? "";
            const isToday = dayDate === todayIso;

            return (
              <section
                key={day}
                className={`flex min-w-[10.5rem] flex-col rounded-xl border transition-ui lg:min-w-0 ${
                  isToday
                    ? "border-brand/40 bg-gradient-to-b from-brand/8 to-card shadow-sm ring-1 ring-brand/20"
                    : "border-border bg-card"
                }`}
              >
                <header
                  className={`border-b px-3 py-3 ${
                    isToday ? "border-brand/20 bg-brand/5" : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div>
                      <p
                        className={`text-xs font-medium uppercase tracking-wide ${
                          isToday ? "text-brand" : "text-muted-foreground"
                        }`}
                      >
                        {DAY_SHORT[day]}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{DAY_LABELS[day]}</p>
                    </div>
                    {isToday ? (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Today
                      </span>
                    ) : null}
                  </div>
                  {dayDate ? (
                    <p className="mt-1 text-xs text-muted-foreground">{formatDayDate(dayDate)}</p>
                  ) : null}
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {lessons.length === 0
                      ? "Free day"
                      : `${lessons.length} lesson${lessons.length === 1 ? "" : "s"}`}
                  </p>
                </header>

                <div className="flex flex-1 flex-col gap-2 p-2">
                  {lessons.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/80 px-2 py-8">
                      <p className="text-center text-xs text-muted-foreground">No classes</p>
                    </div>
                  ) : (
                    lessons.map((lesson) => (
                      <LessonCard key={`${lesson.timetableEntryId}-${lesson.date}`} lesson={lesson} base={base} />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground lg:text-left">
        Swipe horizontally on smaller screens to view the full week. Schedule updates when administrators
        publish a new version.
      </p>
    </div>
  );
}

function TimetableToolbar({
  weekLabel,
  templatesUsed,
  currentMonday,
  weekStart,
  onWeekStartChange,
  onRefresh,
  isFetching,
  base,
}: {
  weekLabel: string;
  templatesUsed: TeacherWeekView["templatesUsed"];
  currentMonday: string;
  weekStart?: string;
  onWeekStartChange?: (next: string | undefined) => void;
  onRefresh?: () => void;
  isFetching?: boolean;
  base: string;
}) {
  const canNavigate = Boolean(onWeekStartChange);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Teaching week</p>
          <h2 className="mt-0.5 text-lg font-semibold text-foreground">{weekLabel}</h2>
          {templatesUsed.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Published schedule · v{templatesUsed.map((t) => t.version).join(", v")}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canNavigate ? (
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
              <button
                type="button"
                aria-label="Previous week"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-ui hover:bg-card"
                onClick={() => onWeekStartChange!(shiftWeekStart(weekStart ?? currentMonday, -1))}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                className="h-9 px-3 text-xs font-medium text-foreground transition-ui hover:bg-card rounded-md"
                onClick={() => onWeekStartChange!(undefined)}
              >
                This week
              </button>
              <button
                type="button"
                aria-label="Next week"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground transition-ui hover:bg-card"
                onClick={() => onWeekStartChange!(shiftWeekStart(weekStart ?? currentMonday, 1))}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : null}
          {onRefresh ? (
            <Button
              type="button"
              variant="secondary"
              className="h-9 gap-1.5 px-3"
              loading={isFetching}
              onClick={onRefresh}
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
              Refresh
            </Button>
          ) : null}
          <Link
            href={`${base}/attendance`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-ui hover:bg-brand-dark"
          >
            <ClipboardCheck className="h-3.5 w-3.5" strokeWidth={2} />
            Attendance
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
  highlight,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  sub: string;
  tone?: "neutral" | "success" | "warning";
  highlight?: boolean;
}) {
  const toneCls =
    tone === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      : tone === "warning"
        ? "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200"
        : highlight
          ? "border-brand/30 bg-brand/10 text-brand"
          : "border-border bg-muted/40 text-foreground";

  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${toneCls}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2} />
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </div>
  );
}

function LessonCard({ lesson, base }: { lesson: TeacherWeekLesson; base: string }) {
  const done = lesson.attendanceStatus === "submitted" || lesson.attendanceStatus === "locked";
  const attendanceHref = `${base}/attendance?timetableEntryId=${encodeURIComponent(lesson.timetableEntryId)}&date=${encodeURIComponent(lesson.date)}`;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-background/80 shadow-sm transition-ui hover:border-brand/30 hover:shadow-md">
      <div
        className={`absolute inset-y-0 left-0 w-1 ${
          done ? "bg-emerald-500" : lesson.attendanceStatus === "draft" ? "bg-amber-500" : "bg-brand"
        }`}
      />
      <div className="p-2.5 pl-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums text-foreground">
            <Clock className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
            {lesson.startTime}–{lesson.endTime}
          </div>
          <Badge tone={attendanceTone(lesson.attendanceStatus)}>{attendanceLabel(lesson.attendanceStatus)}</Badge>
        </div>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {lesson.periodLabel || `Period ${lesson.periodNumber}`}
        </p>
        <p className="mt-1.5 text-sm font-bold leading-tight text-brand">{lesson.subjectCode}</p>
        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{lesson.subjectName}</p>
        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-foreground">
          <Users className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={2} />
          <span className="truncate">
            {classDisplayName({ name: lesson.className, stream: lesson.classStream })}
          </span>
          {lesson.studentCount > 0 ? (
            <span className="shrink-0 text-muted-foreground">· {lesson.studentCount}</span>
          ) : null}
        </div>
        <Link
          href={attendanceHref}
          className={`mt-2.5 flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-ui ${
            done
              ? "border border-border bg-muted/50 text-muted-foreground hover:bg-muted"
              : "bg-brand text-white hover:bg-brand-dark"
          }`}
        >
          <ClipboardCheck className="h-3 w-3" strokeWidth={2} />
          {done ? "View register" : "Take attendance"}
        </Link>
      </div>
    </article>
  );
}
