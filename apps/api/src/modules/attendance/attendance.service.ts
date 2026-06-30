import type {
  AttendanceAdminOverviewQuery,
  AttendanceInput,
  AttendanceLessonRegisterSaveInput,
  AttendanceRegisterSaveInput,
  AttendanceRangeQuery,
  Role,
} from "@uganda-cbc-sms/shared";
import { query, withTransaction } from "../../config/db";
import { HttpError } from "../../utils/httpError";
import { loadPublishedLessonForTeacher } from "../../utils/attendanceLessonAccess";
import { teacherCanAccessClassForAttendance } from "../../utils/teacherTeachingAccess";
import { rethrowAttendanceSaveError } from "./attendanceErrors";
import {
  dedupeAttendanceRows,
  summarizeAttendanceRows,
} from "./attendanceRegisterBulk";
import {
  ensureHomeroomRegisterDraft,
  ensureLessonRegisterDraft,
  replaceRegisterMarks,
} from "./attendanceRegisterPersistence";
import { validateActiveClassStudents } from "../../utils/rosterValidation";

export type AttendanceRegisterMutationResult = {
  saved: number;
  registerId: string | null;
  registerStatus: "draft" | "submitted" | "locked";
  submittedAt: string | null;
  summary: AttendanceRegisterView["summary"];
};

export type AttendanceLessonRegisterMutationResult = AttendanceRegisterMutationResult & {
  registerType: "lesson";
  timetableEntryId: string;
};

type RegisterMeta = {
  registerId: string | null;
  status: "draft" | "submitted" | "locked";
  submittedAt: string | null;
};

export type AttendanceRegisterStudentRow = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  status: "present" | "absent" | "late" | null;
};

export type AttendanceRegisterView = {
  classId: string;
  className: string;
  classStream: string;
  date: string;
  registerId: string | null;
  registerStatus: "draft" | "submitted" | "locked";
  submittedAt: string | null;
  students: AttendanceRegisterStudentRow[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
  };
};

export type AttendanceLessonRegisterView = AttendanceRegisterView & {
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
};

export type AttendanceRangeDaySummary = {
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  unmarked: number;
  attendanceRate: number;
  registerStatus: "draft" | "submitted" | "locked";
};

export async function getAttendanceRegister(
  classId: string,
  date: string,
  role: Role,
  userId: string,
): Promise<AttendanceRegisterView> {
  const allowed = await teacherCanAccessClassForAttendance(userId, classId, role);
  if (!allowed) throw new HttpError(403, "You are not allowed to view attendance for this class");

  const [meta, classMeta, students] = await Promise.all([
    getRegisterMeta(classId, date),
    getClassMeta(classId),
    query<{
      student_id: string;
      student_name: string;
      student_number: string;
      status: "present" | "absent" | "late" | null;
    }>(
      `SELECT
         s.id AS student_id,
         s.full_name AS student_name,
         s.student_number AS student_number,
         a.status
       FROM students s
       LEFT JOIN attendance_registers ar
         ON ar.class_id = $1
        AND ar.date = $2
        AND ar.register_type = 'homeroom'
       LEFT JOIN attendance a
         ON a.student_id = s.id
        AND a.register_id = ar.id
       WHERE s.class_id = $1
         AND s.status = 'active'
       ORDER BY s.student_number, s.full_name`,
      [classId, date],
    ),
  ]);

  const rows = students.rows.map((r) => ({
    studentId: r.student_id,
    studentName: r.student_name,
    studentNumber: r.student_number,
    status: r.status,
  }));
  const present = rows.filter((r) => r.status === "present").length;
  const absent = rows.filter((r) => r.status === "absent").length;
  const late = rows.filter((r) => r.status === "late").length;
  const unmarked = rows.length - present - absent - late;

  return {
    classId,
    className: classMeta.name,
    classStream: classMeta.stream,
    date,
    registerId: meta.registerId,
    registerStatus: meta.status,
    submittedAt: meta.submittedAt,
    students: rows,
    summary: {
      total: rows.length,
      present,
      absent,
      late,
      unmarked,
    },
  };
}

async function persistHomeroomRegisterDraft(
  input: AttendanceRegisterSaveInput,
  recordedBy: string,
): Promise<{ registerId: string; saved: number; summary: AttendanceRegisterView["summary"] }> {
  const rows = dedupeAttendanceRows(input.rows);
  await validateActiveClassStudents(input.classId, rows.map((r) => r.studentId));

  let registerId = "";
  try {
    await withTransaction(async (client) => {
      registerId = await ensureHomeroomRegisterDraft(client, input.classId, input.date, recordedBy);
      await replaceRegisterMarks(
        client,
        registerId,
        input.classId,
        input.date,
        recordedBy,
        rows.map((r) => r.studentId),
        rows.map((r) => r.status),
      );
    });
  } catch (err) {
    rethrowAttendanceSaveError(err, "homeroom");
  }

  return {
    registerId,
    saved: rows.length,
    summary: summarizeAttendanceRows(rows),
  };
}

async function persistLessonRegisterDraft(
  input: AttendanceLessonRegisterSaveInput,
  slot: Awaited<ReturnType<typeof loadPublishedLessonForTeacher>>,
  recordedBy: string,
): Promise<{ registerId: string; saved: number; summary: AttendanceRegisterView["summary"] }> {
  const rows = dedupeAttendanceRows(input.rows);
  await validateActiveClassStudents(slot.classId, rows.map((r) => r.studentId));

  let registerId = "";
  try {
    await withTransaction(async (client) => {
      registerId = await ensureLessonRegisterDraft(client, {
        classId: slot.classId,
        date: input.date,
        timetableEntryId: input.timetableEntryId,
        periodId: slot.periodId,
        classSubjectId: slot.classSubjectId,
        recordedBy,
      });
      await replaceRegisterMarks(
        client,
        registerId,
        slot.classId,
        input.date,
        recordedBy,
        rows.map((r) => r.studentId),
        rows.map((r) => r.status),
      );
    });
  } catch (err) {
    rethrowAttendanceSaveError(err, "lesson");
  }

  return {
    registerId,
    saved: rows.length,
    summary: summarizeAttendanceRows(rows),
  };
}

export async function saveAttendanceRegister(
  input: AttendanceRegisterSaveInput,
  recordedBy: string,
  role: Role,
): Promise<AttendanceRegisterMutationResult> {
  const allowed = await teacherCanAccessClassForAttendance(recordedBy, input.classId, role);
  if (!allowed) throw new HttpError(403, "You are not allowed to record attendance for this class");
  if (input.rows.length > 1000) {
    throw new HttpError(400, "Register is too large. Split the class and try again.");
  }

  const persisted = await persistHomeroomRegisterDraft(input, recordedBy);
  return {
    saved: persisted.saved,
    registerId: persisted.registerId,
    registerStatus: "draft",
    submittedAt: null,
    summary: persisted.summary,
  };
}

export async function submitAttendanceRegister(
  classId: string,
  date: string,
  userId: string,
  role: Role,
  rows?: AttendanceRegisterSaveInput["rows"],
): Promise<AttendanceRegisterMutationResult> {
  const allowed = await teacherCanAccessClassForAttendance(userId, classId, role);
  if (!allowed) throw new HttpError(403, "You are not allowed to submit attendance for this class");

  let saved = 0;
  let summary: AttendanceRegisterView["summary"] = {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    unmarked: 0,
  };
  let registerId: string | null = null;

  if (rows?.length) {
    if (rows.length > 1000) {
      throw new HttpError(400, "Register is too large. Split the class and try again.");
    }
    const persisted = await persistHomeroomRegisterDraft({ classId, date, rows }, userId);
    registerId = persisted.registerId;
    saved = persisted.saved;
    summary = persisted.summary;
  }

  let submittedAt: string | null = null;
  await withTransaction(async (client) => {
    const existing = await client.query<{ id: string; status: "draft" | "submitted" | "locked" }>(
      `SELECT id, status
       FROM attendance_registers
       WHERE class_id = $1
         AND date = $2
         AND register_type = 'homeroom'
       LIMIT 1`,
      [classId, date],
    );
    if (!existing.rows[0]) {
      const inserted = await client.query<{ id: string; submitted_at: string }>(
        `INSERT INTO attendance_registers (class_id, date, register_type, status, recorded_by, submitted_at, updated_at)
         VALUES ($1, $2, 'homeroom', 'submitted', $3, NOW(), NOW())
         RETURNING id, submitted_at`,
        [classId, date, userId],
      );
      registerId = inserted.rows[0]!.id;
      submittedAt = new Date(inserted.rows[0]!.submitted_at).toISOString();
      return;
    }
    if (existing.rows[0].status === "locked") {
      throw new HttpError(400, "This register is locked.");
    }
    const updated = await client.query<{ submitted_at: string }>(
      `UPDATE attendance_registers
       SET status = 'submitted',
           recorded_by = $3,
           submitted_at = COALESCE(submitted_at, NOW()),
           updated_at = NOW()
       WHERE class_id = $1
         AND date = $2
         AND register_type = 'homeroom'
       RETURNING submitted_at`,
      [classId, date, userId],
    );
    registerId = existing.rows[0].id;
    submittedAt = updated.rows[0]
      ? new Date(updated.rows[0].submitted_at).toISOString()
      : null;
  });

  return {
    saved,
    registerId,
    registerStatus: "submitted",
    submittedAt,
    summary,
  };
}

export async function getAttendanceRange(
  filters: AttendanceRangeQuery,
  role: Role,
  userId: string,
): Promise<AttendanceRangeDaySummary[]> {
  const allowed = await teacherCanAccessClassForAttendance(userId, filters.classId, role);
  if (!allowed) throw new HttpError(403, "You are not allowed to view attendance for this class");

  const classRoster = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total
     FROM students
     WHERE class_id = $1 AND status = 'active'`,
    [filters.classId],
  );
  const total = classRoster.rows[0]?.total ?? 0;

  const { rows } = await query<{
    day: string;
    present: number;
    absent: number;
    late: number;
    register_status: "draft" | "submitted" | "locked" | null;
  }>(
    `SELECT
       d.day::date::text AS day,
       COALESCE(COUNT(*) FILTER (WHERE a.status = 'present'), 0)::int AS present,
       COALESCE(COUNT(*) FILTER (WHERE a.status = 'absent'), 0)::int AS absent,
       COALESCE(COUNT(*) FILTER (WHERE a.status = 'late'), 0)::int AS late,
       ar.status AS register_status
     FROM generate_series($2::date, $3::date, interval '1 day') d(day)
     LEFT JOIN attendance a
       ON a.class_id = $1
      AND a.date = d.day::date
     LEFT JOIN attendance_registers ar
       ON ar.class_id = $1
      AND ar.date = d.day::date
      AND ar.register_type = 'homeroom'
     GROUP BY d.day, ar.status
     ORDER BY d.day DESC`,
    [filters.classId, filters.from, filters.to],
  );

  return rows.map((r) => {
    const marked = r.present + r.absent + r.late;
    const unmarked = Math.max(total - marked, 0);
    const attendanceRate = total > 0 ? Math.round(((r.present + r.late) / total) * 1000) / 10 : 0;
    return {
      date: r.day,
      total,
      present: r.present,
      absent: r.absent,
      late: r.late,
      unmarked,
      attendanceRate,
      registerStatus: r.register_status ?? "draft",
    };
  });
}

export async function recordAttendance(input: AttendanceInput, recordedBy: string, role: Role) {
  return saveAttendanceRegister(
    {
      classId: input.classId,
      date: input.date,
      rows: [{ studentId: input.studentId, status: input.status }],
    },
    recordedBy,
    role,
  );
}

export async function listAttendance(classId: string, date: string, role: Role, userId: string) {
  const register = await getAttendanceRegister(classId, date, role, userId);
  return register.students.map((s) => ({
    student_id: s.studentId,
    class_id: classId,
    date,
    status: s.status,
    student_name: s.studentName,
    student_number: s.studentNumber,
  }));
}

async function getRegisterMeta(classId: string, date: string): Promise<RegisterMeta> {
  const { rows } = await query<{
    id: string;
    status: "draft" | "submitted" | "locked";
    submitted_at: string | null;
  }>(
    `SELECT id, status, submitted_at
     FROM attendance_registers
     WHERE class_id = $1
       AND date = $2
       AND register_type = 'homeroom'
     LIMIT 1`,
    [classId, date],
  );
  const row = rows[0];
  if (!row) {
    return {
      registerId: null,
      status: "draft",
      submittedAt: null,
    };
  }
  return {
    registerId: row.id,
    status: row.status,
    submittedAt: row.submitted_at,
  };
}

async function getClassMeta(classId: string): Promise<{ name: string; stream: string }> {
  const { rows } = await query<{ name: string; stream: string | null }>(
    `SELECT name, stream
     FROM classes
     WHERE id = $1
     LIMIT 1`,
    [classId],
  );
  const row = rows[0];
  if (!row) throw new HttpError(404, "Class not found");
  return {
    name: row.name,
    stream: row.stream ?? "",
  };
}

export type AttendanceAdminOverview = {
  kpis: {
    activeStudents: number;
    classCount: number;
    schoolDays: number;
    avgAttendanceRate: number;
    present: number;
    absent: number;
    late: number;
    registersSubmitted: number;
    registersDraft: number;
    registersMissing: number;
  };
  trend: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
    unmarked: number;
    attendanceRate: number;
  }>;
  byClass: Array<{
    classId: string;
    className: string;
    classStream: string;
    level: string;
    activeStudents: number;
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
    registersSubmitted: number;
    registerDaysExpected: number;
  }>;
  statusBreakdown: { present: number; absent: number; late: number };
  registerCompliance: { submitted: number; draft: number; missing: number };
};

function levelSqlVariants(level?: "O_LEVEL" | "A_LEVEL"): string[] | null {
  if (!level) return null;
  return level === "O_LEVEL" ? ["O_LEVEL", "o_level"] : ["A_LEVEL", "a_level"];
}

/** Builds scoped class filter SQL with typed placeholders (avoids untyped NULL params). */
function buildClassScopeFilters(filters: AttendanceAdminOverviewQuery, alias = "c") {
  const parts: string[] = [];
  const params: unknown[] = [];
  const levelVariants = levelSqlVariants(filters.level);

  if (filters.academicYearId) {
    params.push(filters.academicYearId);
    parts.push(`${alias}.academic_year_id = $${params.length}::uuid`);
  }
  if (filters.classId) {
    params.push(filters.classId);
    parts.push(`${alias}.id = $${params.length}::uuid`);
  }
  if (levelVariants) {
    params.push(levelVariants);
    parts.push(`${alias}.level = ANY($${params.length}::text[])`);
  }

  return {
    whereSql: parts.length ? parts.join(" AND ") : "TRUE",
    params,
  };
}

function withDateRange(scopeParams: unknown[], from: string, to: string) {
  const fromIdx = scopeParams.length + 1;
  const toIdx = scopeParams.length + 2;
  return {
    params: [...scopeParams, from, to],
    betweenSql: `BETWEEN $${fromIdx}::date AND $${toIdx}::date`,
    fromParam: `$${fromIdx}::date`,
    toParam: `$${toIdx}::date`,
  };
}

export async function getAttendanceAdminOverview(
  filters: AttendanceAdminOverviewQuery,
): Promise<AttendanceAdminOverview> {
  const scope = buildClassScopeFilters(filters);
  const dates = withDateRange(scope.params, filters.from, filters.to);

  const rosterQ = await query<{ total: number; class_count: number }>(
    `SELECT
       COALESCE(SUM(cnt), 0)::int AS total,
       COUNT(*)::int AS class_count
     FROM (
       SELECT c.id, COUNT(s.id)::int AS cnt
       FROM classes c
       JOIN students s ON s.class_id = c.id AND s.status = 'active'
       WHERE ${scope.whereSql}
       GROUP BY c.id
     ) x`,
    scope.params,
  );
  const activeStudents = rosterQ.rows[0]?.total ?? 0;
  const classCount = rosterQ.rows[0]?.class_count ?? 0;

  const marksQ = await query<{ present: number; absent: number; late: number }>(
    `SELECT
       COALESCE(COUNT(*) FILTER (WHERE a.status = 'present'), 0)::int AS present,
       COALESCE(COUNT(*) FILTER (WHERE a.status = 'absent'), 0)::int AS absent,
       COALESCE(COUNT(*) FILTER (WHERE a.status = 'late'), 0)::int AS late
     FROM attendance a
     JOIN classes c ON c.id = a.class_id
     WHERE a.date ${dates.betweenSql}
       AND ${scope.whereSql}`,
    dates.params,
  );
  const present = marksQ.rows[0]?.present ?? 0;
  const absent = marksQ.rows[0]?.absent ?? 0;
  const late = marksQ.rows[0]?.late ?? 0;
  const marked = present + absent + late;
  const avgAttendanceRate = marked > 0 ? Math.round(((present + late) / marked) * 1000) / 10 : 0;

  const daysQ = await query<{ school_days: number }>(
    `SELECT (($2::date - $1::date) + 1)::int AS school_days`,
    [filters.from, filters.to],
  );
  const schoolDays = daysQ.rows[0]?.school_days ?? 0;
  const registerDaysExpected = classCount * schoolDays;

  const registersQ = await query<{ submitted: number; draft: number }>(
    `SELECT
       COALESCE(COUNT(*) FILTER (WHERE ar.status IN ('submitted', 'locked')), 0)::int AS submitted,
       COALESCE(COUNT(*) FILTER (WHERE ar.status = 'draft'), 0)::int AS draft
     FROM attendance_registers ar
     JOIN classes c ON c.id = ar.class_id
     WHERE ar.date ${dates.betweenSql}
       AND ${scope.whereSql}`,
    dates.params,
  );
  const registersSubmitted = registersQ.rows[0]?.submitted ?? 0;
  const registersDraft = registersQ.rows[0]?.draft ?? 0;
  const registersMissing = Math.max(registerDaysExpected - registersSubmitted - registersDraft, 0);

  const trendJoinFilter = scope.whereSql === "TRUE" ? "TRUE" : scope.whereSql;
  const trendQ = await query<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>(
    `SELECT
       d.day::text AS date,
       COALESCE(COUNT(*) FILTER (WHERE a.status = 'present' AND c.id IS NOT NULL), 0)::int AS present,
       COALESCE(COUNT(*) FILTER (WHERE a.status = 'absent' AND c.id IS NOT NULL), 0)::int AS absent,
       COALESCE(COUNT(*) FILTER (WHERE a.status = 'late' AND c.id IS NOT NULL), 0)::int AS late
     FROM generate_series(${dates.fromParam}, ${dates.toParam}, interval '1 day') d(day)
     LEFT JOIN attendance a ON a.date = d.day::date
     LEFT JOIN classes c ON c.id = a.class_id AND ${trendJoinFilter}
     GROUP BY d.day
     ORDER BY d.day ASC`,
    dates.params,
  );

  const trend = trendQ.rows.map((r) => {
    const dayMarked = r.present + r.absent + r.late;
    const unmarked = Math.max(activeStudents - dayMarked, 0);
    const attendanceRate =
      activeStudents > 0 ? Math.round(((r.present + r.late) / activeStudents) * 1000) / 10 : 0;
    return {
      date: r.date,
      present: r.present,
      absent: r.absent,
      late: r.late,
      unmarked,
      attendanceRate,
    };
  });

  const byClassQ = await query<{
    class_id: string;
    class_name: string;
    class_stream: string | null;
    level: string;
    active_students: number;
    present: number;
    absent: number;
    late: number;
    registers_submitted: number;
  }>(
    `SELECT
       c.id AS class_id,
       c.name AS class_name,
       c.stream AS class_stream,
       c.level,
       COALESCE(r.active_students, 0)::int AS active_students,
       COALESCE(m.present, 0)::int AS present,
       COALESCE(m.absent, 0)::int AS absent,
       COALESCE(m.late, 0)::int AS late,
       COALESCE(reg.submitted_days, 0)::int AS registers_submitted
     FROM classes c
     LEFT JOIN (
       SELECT s.class_id, COUNT(*)::int AS active_students
       FROM students s
       WHERE s.status = 'active'
       GROUP BY s.class_id
     ) r ON r.class_id = c.id
     LEFT JOIN (
       SELECT
         a.class_id,
         COUNT(*) FILTER (WHERE a.status = 'present')::int AS present,
         COUNT(*) FILTER (WHERE a.status = 'absent')::int AS absent,
         COUNT(*) FILTER (WHERE a.status = 'late')::int AS late
       FROM attendance a
       WHERE a.date ${dates.betweenSql}
       GROUP BY a.class_id
     ) m ON m.class_id = c.id
     LEFT JOIN (
       SELECT
         ar.class_id,
         COUNT(*)::int AS submitted_days
       FROM attendance_registers ar
       WHERE ar.date ${dates.betweenSql}
         AND ar.status IN ('submitted', 'locked')
       GROUP BY ar.class_id
     ) reg ON reg.class_id = c.id
     WHERE ${scope.whereSql}
     ORDER BY c.name, c.stream`,
    dates.params,
  );

  const byClass = byClassQ.rows.map((r) => {
    const classMarked = r.present + r.absent + r.late;
    const attendanceRate =
      classMarked > 0 ? Math.round(((r.present + r.late) / classMarked) * 1000) / 10 : 0;
    return {
      classId: r.class_id,
      className: r.class_name,
      classStream: r.class_stream ?? "",
      level: r.level === "o_level" || r.level === "O_LEVEL" ? "O_LEVEL" : "A_LEVEL",
      activeStudents: r.active_students,
      present: r.present,
      absent: r.absent,
      late: r.late,
      attendanceRate,
      registersSubmitted: r.registers_submitted,
      registerDaysExpected: schoolDays,
    };
  });

  return {
    kpis: {
      activeStudents,
      classCount,
      schoolDays,
      avgAttendanceRate,
      present,
      absent,
      late,
      registersSubmitted,
      registersDraft,
      registersMissing,
    },
    trend,
    byClass,
    statusBreakdown: { present, absent, late },
    registerCompliance: {
      submitted: registersSubmitted,
      draft: registersDraft,
      missing: registersMissing,
    },
  };
}

async function getLessonRegisterMeta(
  timetableEntryId: string,
  date: string,
): Promise<RegisterMeta> {
  const { rows } = await query<{
    id: string;
    status: "draft" | "submitted" | "locked";
    submitted_at: string | null;
  }>(
    `SELECT id, status, submitted_at
     FROM attendance_registers
     WHERE timetable_entry_id = $1
       AND date = $2
       AND register_type = 'lesson'
     LIMIT 1`,
    [timetableEntryId, date],
  );
  const row = rows[0];
  if (!row) {
    return { registerId: null, status: "draft", submittedAt: null };
  }
  return {
    registerId: row.id,
    status: row.status,
    submittedAt: row.submitted_at,
  };
}

export async function getAttendanceLessonRegister(
  timetableEntryId: string,
  date: string,
  role: Role,
  userId: string,
): Promise<AttendanceLessonRegisterView> {
  const slot = await loadPublishedLessonForTeacher(timetableEntryId, userId, date);
  if (role !== "admin" && role !== "headteacher" && slot.teacherId !== userId) {
    throw new HttpError(403, "You can only mark attendance for lessons assigned to you on the published timetable.");
  }

  const [meta, students] = await Promise.all([
    getLessonRegisterMeta(timetableEntryId, date),
    query<{
      student_id: string;
      student_name: string;
      student_number: string;
      status: "present" | "absent" | "late" | null;
    }>(
      `SELECT
         s.id AS student_id,
         s.full_name AS student_name,
         s.student_number AS student_number,
         a.status
       FROM students s
       LEFT JOIN attendance_registers ar
         ON ar.timetable_entry_id = $1
        AND ar.date = $2
        AND ar.register_type = 'lesson'
       LEFT JOIN attendance a
         ON a.student_id = s.id
        AND a.register_id = ar.id
       WHERE s.class_id = $3
         AND s.status = 'active'
       ORDER BY s.student_number, s.full_name`,
      [timetableEntryId, date, slot.classId],
    ),
  ]);

  const rows = students.rows.map((r) => ({
    studentId: r.student_id,
    studentName: r.student_name,
    studentNumber: r.student_number,
    status: r.status,
  }));
  const present = rows.filter((r) => r.status === "present").length;
  const absent = rows.filter((r) => r.status === "absent").length;
  const late = rows.filter((r) => r.status === "late").length;
  const unmarked = rows.length - present - absent - late;

  return {
    registerType: "lesson",
    timetableEntryId: slot.timetableEntryId,
    classSubjectId: slot.classSubjectId,
    periodId: slot.periodId,
    periodLabel: slot.periodLabel,
    periodNumber: slot.periodNumber,
    startTime: slot.startTime,
    endTime: slot.endTime,
    subjectName: slot.subjectName,
    subjectCode: slot.subjectCode,
    templateId: slot.templateId,
    templateVersion: slot.templateVersion,
    classId: slot.classId,
    className: slot.className,
    classStream: slot.classStream,
    date,
    registerId: meta.registerId,
    registerStatus: meta.status,
    submittedAt: meta.submittedAt,
    students: rows,
    summary: { total: rows.length, present, absent, late, unmarked },
  };
}

export async function saveAttendanceLessonRegister(
  input: AttendanceLessonRegisterSaveInput,
  recordedBy: string,
  role: Role,
): Promise<AttendanceLessonRegisterMutationResult> {
  const slot = await loadPublishedLessonForTeacher(input.timetableEntryId, recordedBy, input.date);
  if (role !== "admin" && role !== "headteacher" && slot.teacherId !== recordedBy) {
    throw new HttpError(403, "You can only mark attendance for lessons assigned to you on the published timetable.");
  }
  if (input.rows.length > 1000) {
    throw new HttpError(400, "Register is too large. Split the class and try again.");
  }

  const persisted = await persistLessonRegisterDraft(input, slot, recordedBy);
  return {
    registerType: "lesson",
    timetableEntryId: input.timetableEntryId,
    saved: persisted.saved,
    registerId: persisted.registerId,
    registerStatus: "draft",
    submittedAt: null,
    summary: persisted.summary,
  };
}

export async function submitAttendanceLessonRegister(
  timetableEntryId: string,
  date: string,
  userId: string,
  role: Role,
  rows?: AttendanceLessonRegisterSaveInput["rows"],
): Promise<AttendanceLessonRegisterMutationResult> {
  const slot = await loadPublishedLessonForTeacher(timetableEntryId, userId, date);
  if (role !== "admin" && role !== "headteacher" && slot.teacherId !== userId) {
    throw new HttpError(403, "You can only mark attendance for lessons assigned to you on the published timetable.");
  }

  let saved = 0;
  let summary: AttendanceRegisterView["summary"] = {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    unmarked: 0,
  };
  let registerId: string | null = null;

  if (rows?.length) {
    if (rows.length > 1000) {
      throw new HttpError(400, "Register is too large. Split the class and try again.");
    }
    const persisted = await persistLessonRegisterDraft(
      { timetableEntryId, date, rows },
      slot,
      userId,
    );
    registerId = persisted.registerId;
    saved = persisted.saved;
    summary = persisted.summary;
  }

  let submittedAt: string | null = null;
  await withTransaction(async (client) => {
    const existing = await client.query<{ id: string; status: "draft" | "submitted" | "locked" }>(
      `SELECT id, status
       FROM attendance_registers
       WHERE timetable_entry_id = $1
         AND date = $2
         AND register_type = 'lesson'
       LIMIT 1`,
      [timetableEntryId, date],
    );
    if (!existing.rows[0]) {
      const inserted = await client.query<{ id: string; submitted_at: string }>(
        `INSERT INTO attendance_registers (
           class_id, date, register_type, timetable_entry_id, period_id, class_subject_id,
           status, recorded_by, submitted_at, updated_at
         )
         VALUES ($1, $2, 'lesson', $3, $4, $5, 'submitted', $6, NOW(), NOW())
         RETURNING id, submitted_at`,
        [
          slot.classId,
          date,
          timetableEntryId,
          slot.periodId,
          slot.classSubjectId,
          userId,
        ],
      );
      registerId = inserted.rows[0]!.id;
      submittedAt = new Date(inserted.rows[0]!.submitted_at).toISOString();
      return;
    }
    if (existing.rows[0].status === "locked") {
      throw new HttpError(400, "This register is locked.");
    }
    const updated = await client.query<{ submitted_at: string }>(
      `UPDATE attendance_registers
       SET status = 'submitted',
           recorded_by = $3,
           submitted_at = COALESCE(submitted_at, NOW()),
           updated_at = NOW()
       WHERE timetable_entry_id = $1
         AND date = $2
         AND register_type = 'lesson'
       RETURNING submitted_at`,
      [timetableEntryId, date, userId],
    );
    registerId = existing.rows[0].id;
    submittedAt = updated.rows[0]
      ? new Date(updated.rows[0].submitted_at).toISOString()
      : null;
  });

  return {
    registerType: "lesson",
    timetableEntryId,
    saved,
    registerId,
    registerStatus: "submitted",
    submittedAt,
    summary,
  };
}
