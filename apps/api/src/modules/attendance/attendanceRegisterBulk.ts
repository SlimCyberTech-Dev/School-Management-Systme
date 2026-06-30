import type { AttendanceRegisterRowInput } from "@uganda-cbc-sms/shared";
import { BULK_CHUNK_SIZE } from "../../utils/bulkConstants";

export type AttendanceSummary = {
  total: number;
  present: number;
  absent: number;
  late: number;
  unmarked: number;
};

/** Last status wins when duplicate student rows are posted. */
export function dedupeAttendanceRows(
  rows: AttendanceRegisterRowInput[],
): AttendanceRegisterRowInput[] {
  const byStudent = new Map<string, AttendanceRegisterRowInput>();
  for (const row of rows) {
    byStudent.set(row.studentId, row);
  }
  return [...byStudent.values()];
}

export function summarizeAttendanceRows(rows: AttendanceRegisterRowInput[]): AttendanceSummary {
  const present = rows.filter((r) => r.status === "present").length;
  const absent = rows.filter((r) => r.status === "absent").length;
  const late = rows.filter((r) => r.status === "late").length;
  return {
    total: rows.length,
    present,
    absent,
    late,
    unmarked: 0,
  };
}

export { BULK_CHUNK_SIZE as ATTENDANCE_REGISTER_CHUNK };
