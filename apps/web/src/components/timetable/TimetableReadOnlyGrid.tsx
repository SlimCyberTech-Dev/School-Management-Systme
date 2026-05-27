"use client";

import { useMemo } from "react";
import type { TimetableGridView } from "@uganda-cbc-sms/shared";
import { classDisplayName } from "@/lib/academicLevel";

const DAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

const DAY_SHORT: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};

type ViewMode = "class" | "teacher";

export function TimetableReadOnlyGrid({
  grid,
  viewMode,
}: {
  grid: TimetableGridView;
  viewMode: ViewMode;
}) {
  const schoolDays = useMemo(() => grid.days.filter((d) => d.isSchoolDay), [grid.days]);
  const teachingPeriods = useMemo(() => grid.periods.filter((p) => p.isTeaching), [grid.periods]);

  const cellMap = useMemo(() => {
    const map = new Map<string, (typeof grid.cells)[0]>();
    for (const cell of grid.cells) {
      map.set(`${cell.dayOfWeek}:${cell.periodId}`, cell);
    }
    return map;
  }, [grid.cells]);

  const filledCount = grid.cells.filter((c) => c.classSubjectId).length;
  const totalSlots = schoolDays.length * teachingPeriods.length;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {filledCount} of {totalSlots} teaching slots filled
        {grid.template.version > 0 ? ` · v${grid.template.version}` : null}
      </p>
      <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-10 min-w-[7rem] border-r border-border bg-muted/80 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Period
              </th>
              {schoolDays.map((d) => (
                <th
                  key={d.dayOfWeek}
                  className="min-w-[9.5rem] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  <span className="text-foreground">{DAY_SHORT[d.dayOfWeek]}</span>
                  <span className="mt-0.5 block font-normal normal-case text-muted-foreground">
                    {DAY_LABELS[d.dayOfWeek]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.periods.map((period) => {
              if (!period.isTeaching) {
                return (
                  <tr key={period.id} className="border-b border-border bg-muted/20">
                    <td
                      colSpan={schoolDays.length + 1}
                      className="px-3 py-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {period.label} · {period.startTime}–{period.endTime}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={period.id} className="border-b border-border last:border-0">
                  <td className="sticky left-0 z-10 border-r border-border bg-card px-3 py-2">
                    <div className="text-xs font-semibold text-foreground">{period.label}</div>
                    <div className="tabular-nums text-[11px] text-muted-foreground">
                      {period.startTime}–{period.endTime}
                    </div>
                  </td>
                  {schoolDays.map((day) => {
                    const cell = cellMap.get(`${day.dayOfWeek}:${period.id}`);
                    const filled = Boolean(cell?.classSubjectId);
                    return (
                      <td key={`${day.dayOfWeek}-${period.id}`} className="px-1.5 py-1.5 align-top">
                        {filled ? (
                          <div
                            className={`min-h-[4.5rem] rounded-lg border px-2 py-2 ${
                              viewMode === "class"
                                ? "border-brand/25 bg-brand/5"
                                : "border-emerald-500/25 bg-emerald-500/8"
                            }`}
                          >
                            <p className="text-xs font-bold text-brand">{cell!.subjectCode}</p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] leading-tight text-muted-foreground">
                              {cell!.subjectName}
                            </p>
                            {viewMode === "class" ? (
                              <p className="mt-1 truncate text-[11px] font-medium text-foreground">
                                {cell!.teacherName ?? "Unassigned"}
                              </p>
                            ) : (
                              <p className="mt-1 truncate text-[11px] font-medium text-foreground">
                                {classDisplayName({
                                  name: cell!.className ?? "",
                                  stream: cell!.classStream ?? "",
                                })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex min-h-[4.5rem] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10">
                            <span className="text-[11px] text-muted-foreground">Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
