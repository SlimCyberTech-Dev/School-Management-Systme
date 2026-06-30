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

export type LessonRegisterMutation = {
  registerType: "lesson";
  timetableEntryId: string;
  saved: number;
  registerId: string | null;
  registerStatus: "draft" | "submitted" | "locked";
  submittedAt: string | null;
  summary: LessonRegisterResponse["summary"];
};

export function mergeLessonRegister(
  prev: LessonRegisterResponse,
  patch: LessonRegisterMutation,
): LessonRegisterResponse {
  return {
    ...prev,
    registerId: patch.registerId ?? prev.registerId,
    registerStatus: patch.registerStatus,
    submittedAt: patch.submittedAt,
    summary: patch.summary,
  };
}

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
  const queryKey = ["attendance-lesson-register", timetableEntryId, date] as const;

  const patchCache = (patch: LessonRegisterMutation) => {
    qc.setQueryData<LessonRegisterResponse>(queryKey, (prev) =>
      prev ? mergeLessonRegister(prev, patch) : prev,
    );
  };

  const save = useMutation({
    mutationFn: (payload: AttendanceLessonRegisterSaveInput) =>
      apiPut<LessonRegisterMutation>("/attendance/lesson-register", payload),
    onSuccess: (patch) => patchCache(patch),
  });

  const submit = useMutation({
    mutationFn: (rows?: AttendanceLessonRegisterSaveInput["rows"]) =>
      apiPost<LessonRegisterMutation>("/attendance/lesson-register/submit", {
        timetableEntryId,
        date,
        rows,
      }),
    onSuccess: (patch) => patchCache(patch),
  });

  return { save, submit };
}
