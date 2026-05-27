"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AttendanceLessonRegisterSaveInput } from "@uganda-cbc-sms/shared";
import { apiGet, apiPost, apiPut } from "@/lib/api";

export type LessonRegisterResponse = {
  registerType: "lesson";
  timetableEntryId: string;
  classSubjectId: string;
  periodId: string;
  periodLabel: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  subjectCode: string;
  templateId: string;
  templateVersion: number;
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
    status: "present" | "absent" | "late" | null;
  }>;
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
  };
};

export function useLessonAttendanceRegister(timetableEntryId: string, date: string) {
  const enabled = Boolean(timetableEntryId && date);
  return useQuery({
    queryKey: ["attendance-lesson-register", timetableEntryId, date],
    queryFn: () =>
      apiGet<LessonRegisterResponse>(
        `/attendance/lesson-register?timetableEntryId=${encodeURIComponent(timetableEntryId)}&date=${encodeURIComponent(date)}`,
      ),
    enabled,
    refetchOnWindowFocus: true,
  });
}

export function useLessonAttendanceMutations(timetableEntryId: string, date: string) {
  const qc = useQueryClient();

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ["attendance-lesson-register", timetableEntryId, date] });
    await qc.invalidateQueries({ queryKey: ["timetable-today"] });
    await qc.invalidateQueries({ queryKey: ["timetable-my-week"] });
  };

  const save = useMutation({
    mutationFn: (payload: AttendanceLessonRegisterSaveInput) =>
      apiPut<LessonRegisterResponse>("/attendance/lesson-register", payload),
    onSuccess: () => void invalidate(),
  });

  const submit = useMutation({
    mutationFn: () =>
      apiPost<LessonRegisterResponse>("/attendance/lesson-register/submit", {
        timetableEntryId,
        date,
      }),
    onSuccess: () => void invalidate(),
  });

  return { save, submit };
}
