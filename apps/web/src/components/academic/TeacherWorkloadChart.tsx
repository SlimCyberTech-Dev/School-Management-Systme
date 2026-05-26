"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartPanel } from "@/components/reports/ChartPanel";
import { CHART_COLORS } from "@/components/reports/chartTheme";

export type TeacherWorkloadSummary = {
  teachers: Array<{
    teacherId: string;
    teacherName: string;
    role: string;
    assignmentCount: number;
  }>;
  totalSlots: number;
  assignedSlots: number;
  unassignedSlots: number;
  averageAssignments: number;
  maxAssignments: number;
};

const ROLE_LABELS: Record<string, string> = {
  subject_teacher: "Subject teacher",
  class_teacher: "Class teacher",
  headteacher: "Headteacher",
  admin: "Admin",
};

function shortName(fullName: string, maxLen = 22): string {
  if (fullName.length <= maxLen) return fullName;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    const compact = `${parts[0]} ${parts[parts.length - 1]![0]}.`;
    if (compact.length <= maxLen) return compact;
  }
  return `${fullName.slice(0, maxLen - 1)}…`;
}

function barFill(
  count: number,
  average: number,
  teacherId: string,
  selectedTeacherId?: string,
): string {
  if (teacherId === selectedTeacherId) return "#2563eb";
  if (count === 0) return "#cbd5e1";
  if (average > 0 && count > average * 1.25) return "#d97706";
  if (average > 0 && count < average * 0.75) return "#16a34a";
  return CHART_COLORS[0]!;
}

type ChartRow = {
  teacherId: string;
  label: string;
  fullName: string;
  role: string;
  roleLabel: string;
  assignments: number;
};

function WorkloadTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartRow }>;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{row.fullName}</p>
      <p className="text-muted-foreground">{row.roleLabel}</p>
      <p className="mt-1 text-foreground">
        <span className="font-medium">{row.assignments}</span> class–subject slot
        {row.assignments === 1 ? "" : "s"}
      </p>
    </div>
  );
}

function StatPill({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TeacherWorkloadChart({
  summary,
  selectedTeacherId,
  onSelectTeacher,
  loading,
}: {
  summary: TeacherWorkloadSummary | null;
  selectedTeacherId?: string;
  onSelectTeacher?: (teacherId: string) => void;
  loading?: boolean;
}) {
  const chartData = useMemo((): ChartRow[] => {
    if (!summary) return [];
    return summary.teachers
      .filter((t) => t.assignmentCount > 0 || t.teacherId === selectedTeacherId)
      .map((t) => ({
        teacherId: t.teacherId,
        label: shortName(t.teacherName),
        fullName: t.teacherName,
        role: t.role,
        roleLabel: ROLE_LABELS[t.role] ?? t.role.replace(/_/g, " "),
        assignments: t.assignmentCount,
      }))
      .sort((a, b) => b.assignments - a.assignments || a.fullName.localeCompare(b.fullName));
  }, [summary, selectedTeacherId]);

  const teachersWithZero =
    summary?.teachers.filter((t) => t.assignmentCount === 0).length ?? 0;

  const chartHeight = Math.min(520, Math.max(300, chartData.length * 36 + 48));
  const average = summary?.averageAssignments ?? 0;
  const xMax = Math.max(summary?.maxAssignments ?? 0, 1);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
        <div className="h-[320px] animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Class–subject slots" value={summary.totalSlots} hint="For selected filters" />
        <StatPill
          label="Assigned"
          value={summary.assignedSlots}
          hint={
            summary.totalSlots > 0
              ? `${Math.round((summary.assignedSlots / summary.totalSlots) * 100)}% filled`
              : undefined
          }
        />
        <StatPill label="Unassigned" value={summary.unassignedSlots} />
        <StatPill
          label="Avg per active teacher"
          value={summary.averageAssignments}
          hint={`${teachersWithZero} with no slots`}
        />
      </div>

      <ChartPanel
        title="Assignments by teacher"
        subtitle={
          onSelectTeacher
            ? "Click a bar to open that teacher’s assignments below"
            : "Subject slots assigned per teacher for this year"
        }
        empty={chartData.length === 0}
        chartHeight={chartHeight}
      >
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis
                  type="number"
                  domain={[0, xMax + Math.ceil(xMax * 0.1)]}
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={108}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip content={<WorkloadTooltip />} cursor={{ fill: "rgba(37, 99, 235, 0.08)" }} />
                {average > 0 ? (
                  <ReferenceLine
                    x={average}
                    stroke="#7c3aed"
                    strokeDasharray="4 4"
                    label={{
                      value: `Avg ${average}`,
                      position: "top",
                      fill: "#7c3aed",
                      fontSize: 10,
                    }}
                  />
                ) : null}
                <Bar
                  dataKey="assignments"
                  name="Slots"
                  radius={[0, 4, 4, 0]}
                  cursor={onSelectTeacher ? "pointer" : undefined}
                  onClick={(bar) => {
                    const row = (bar as { payload?: ChartRow })?.payload;
                    if (row?.teacherId && onSelectTeacher) onSelectTeacher(row.teacherId);
                  }}
                >
                  {chartData.map((row) => (
                    <Cell
                      key={row.teacherId}
                      fill={barFill(row.assignments, average, row.teacherId, selectedTeacherId)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
        ) : null}
      </ChartPanel>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#2563eb]" />
          Selected teacher
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#d97706]" />
          Above average (+25%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#16a34a]" />
          Below average (−25%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-dashed border-[#7c3aed]" />
          School average
        </span>
      </div>
    </div>
  );
}
