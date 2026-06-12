import { query } from "../config/db";
import { HttpError } from "./httpError";

export type PublishedLessonSlot = {
  timetableEntryId: string;
  classId: string;
  classSubjectId: string;
  periodId: string;
  dayOfWeek: number;
  teacherId: string;
  className: string;
  classStream: string;
  subjectName: string;
  subjectCode: string;
  periodLabel: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  templateId: string;
  templateVersion: number;
};

export function dayOfWeekFromDate(date: string): number {
  const d = new Date(`${date}T12:00:00`);
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

export async function loadPublishedLessonForTeacher(
  timetableEntryId: string,
  teacherId: string,
  date: string,
): Promise<PublishedLessonSlot> {
  const { rows } = await query<{
    id: string;
    class_id: string;
    class_subject_id: string;
    period_id: string;
    day_of_week: number;
    teacher_id: string;
    class_name: string;
    class_stream: string | null;
    subject_name: string;
    subject_code: string;
    period_label: string;
    period_number: number;
    start_time: string;
    end_time: string;
    template_id: string;
    template_version: number;
  }>(
    `SELECT
       e.id,
       e.class_id,
       e.class_subject_id,
       e.period_id,
       e.day_of_week,
       e.teacher_id,
       c.name AS class_name,
       c.stream AS class_stream,
       s.name AS subject_name,
       s.code AS subject_code,
       p.label AS period_label,
       p.period_number,
       p.start_time::text,
       p.end_time::text,
       tt.id AS template_id,
       tt.version AS template_version
     FROM timetable_entries e
     JOIN timetable_templates tt ON tt.id = e.template_id AND tt.status = 'published'
     JOIN timetable_periods p ON p.id = e.period_id AND p.is_teaching = true
     JOIN classes c ON c.id = e.class_id
     JOIN class_subjects cs ON cs.id = e.class_subject_id
     JOIN subjects s ON s.id = cs.subject_id
     WHERE e.id = $1
       AND e.teacher_id = $2
     LIMIT 1`,
    [timetableEntryId, teacherId],
  );

  const row = rows[0];
  if (!row) {
    throw new HttpError(
      404,
      "This lesson is not on your published timetable. Refresh — the schedule may have been updated.",
    );
  }

  const expectedDow = dayOfWeekFromDate(date);
  if (row.day_of_week !== expectedDow) {
    const lessonDay = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][
      row.day_of_week
    ];
    throw new HttpError(
      400,
      `This lesson runs on ${lessonDay ?? "another day"}, not on the date you selected. Open it from your timetable or change the date.`,
    );
  }

  return {
    timetableEntryId: row.id,
    classId: row.class_id,
    classSubjectId: row.class_subject_id,
    periodId: row.period_id,
    dayOfWeek: row.day_of_week,
    teacherId: row.teacher_id,
    className: row.class_name,
    classStream: row.class_stream ?? "",
    subjectName: row.subject_name,
    subjectCode: row.subject_code,
    periodLabel: row.period_label,
    periodNumber: row.period_number,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
    templateId: row.template_id,
    templateVersion: row.template_version,
  };
}
