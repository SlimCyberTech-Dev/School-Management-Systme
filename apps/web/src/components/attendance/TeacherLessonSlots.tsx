"use client";

import type { TeacherWeekLesson } from "@uganda-cbc-sms/shared";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { classDisplayName } from "@/lib/academicLevel";

function attendanceTone(status: TeacherWeekLesson["attendanceStatus"]) {
  if (status === "submitted" || status === "locked") return "success" as const;
  if (status === "draft") return "warning" as const;
  return "neutral" as const;
}

function attendanceLabel(status: TeacherWeekLesson["attendanceStatus"]) {
  if (status === "submitted" || status === "locked") return "Submitted";
  if (status === "draft") return "Draft";
  return "Not marked";
}

export function TeacherLessonSlots({
  lessons,
  selectedEntryId,
  onSelect,
}: {
  lessons: TeacherWeekLesson[];
  selectedEntryId: string | null;
  onSelect: (lesson: TeacherWeekLesson) => void;
}) {
  if (lessons.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        No lessons on your published timetable for this date. If the school updated the schedule, refresh
        this page.
      </p>
    );
  }

  const sorted = [...lessons].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <ul className="space-y-2">
      {sorted.map((lesson) => {
        const selected = lesson.timetableEntryId === selectedEntryId;
        return (
          <li key={`${lesson.timetableEntryId}-${lesson.date}`}>
            <button
              type="button"
              onClick={() => onSelect(lesson)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition-ui ${
                selected
                  ? "border-brand bg-brand/5 shadow-sm"
                  : "border-border bg-card hover:border-brand/40 hover:bg-accent/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {lesson.startTime}–{lesson.endTime}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {lesson.periodLabel || `Period ${lesson.periodNumber}`}
                    </span>
                  </p>
                  <p className="mt-1 font-medium text-brand">
                    {lesson.subjectCode} · {lesson.subjectName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {classDisplayName({ name: lesson.className, stream: lesson.classStream })}
                    {lesson.studentCount > 0 ? ` · ${lesson.studentCount} learners` : null}
                  </p>
                </div>
                <Badge tone={attendanceTone(lesson.attendanceStatus)}>{attendanceLabel(lesson.attendanceStatus)}</Badge>
              </div>
              {selected ? (
                <p className="mt-2 text-xs text-brand">Selected — mark attendance below</p>
              ) : (
                <div className="mt-2">
                  <span className="text-xs font-medium text-brand">Take attendance →</span>
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
