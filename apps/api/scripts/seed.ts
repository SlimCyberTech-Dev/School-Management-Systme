import "dotenv/config";
import bcrypt from "bcrypt";
import type { Role } from "@uganda-cbc-sms/shared";
import { pool } from "../src/config/db";

const SAMPLE_USERS: Array<{ fullName: string; email: string; role: Role }> = [
  { fullName: "System Administrator", email: "admin@school.local", role: "admin" },
  { fullName: "School Headteacher", email: "headteacher@school.local", role: "headteacher" },
  { fullName: "Class Teacher", email: "classteacher@school.local", role: "class_teacher" },
  { fullName: "Subject Teacher", email: "subjectteacher@school.local", role: "subject_teacher" },
  { fullName: "Bursar Officer", email: "bursar@school.local", role: "bursar" },
];

type RefIds = {
  classTeacherId: string | null;
  subjectTeacherId: string | null;
  yearId: string;
  termId: string;
  oLevelClassId: string;
  aLevelClassId: string;
  comboId: string;
};

type StudentSeed = {
  studentNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  guardianName: string;
  guardianContact: string;
  classId: string;
  combinationId: string | null;
};

function buildSampleStudents(refs: RefIds): StudentSeed[] {
  const firstNames = [
    "Amina",
    "Brian",
    "Clara",
    "David",
    "Esther",
    "Farouk",
    "Grace",
    "Henry",
    "Irene",
    "James",
    "Kevin",
    "Lilian",
    "Moses",
    "Naomi",
    "Oscar",
    "Patricia",
    "Queen",
    "Robert",
    "Sarah",
    "Timothy",
  ];
  const lastNames = [
    "Nabirye",
    "Ssenkumba",
    "Atwine",
    "Okello",
    "Nansubuga",
    "Kato",
    "Namara",
    "Tumusiime",
    "Mugisha",
    "Achieng",
  ];

  return firstNames.map((first, idx) => {
    const last = lastNames[idx % lastNames.length]!;
    const year = 2026;
    const serial = String(idx + 1).padStart(4, "0");
    const isALevel = idx >= 14;
    const month = String((idx % 12) + 1).padStart(2, "0");
    const day = String(((idx * 2) % 27) + 1).padStart(2, "0");
    return {
      studentNumber: `SMS-${year}-${serial}`,
      fullName: `${first} ${last}`,
      dateOfBirth: `${2008 + (idx % 4)}-${month}-${day}`,
      gender: idx % 2 === 0 ? "female" : "male",
      guardianName: `${last} Parent`,
      guardianContact: `070000${String(100 + idx).padStart(3, "0")}`,
      classId: isALevel ? refs.aLevelClassId : refs.oLevelClassId,
      combinationId: isALevel ? refs.comboId : null,
    };
  });
}

async function ensureAcademicBaseline(classTeacherId: string | null, subjectTeacherId: string | null): Promise<RefIds> {
  const yearName = process.env.SAMPLE_ACADEMIC_YEAR_NAME ?? "2026";
  let yearId =
    (
      await pool.query<{ id: string }>(
        `SELECT id FROM academic_years WHERE name = $1 ORDER BY created_at DESC LIMIT 1`,
        [yearName],
      )
    ).rows[0]?.id ?? null;
  if (!yearId) {
    const year = await pool.query<{ id: string }>(
      `INSERT INTO academic_years (name, start_date, end_date, is_active)
       VALUES ($1, '2026-02-03', '2026-12-04', true)
       RETURNING id`,
      [yearName],
    );
    yearId = year.rows[0]?.id ?? null;
  }
  if (!yearId) {
    throw new Error("Could not create or locate academic year for student seed");
  }

  await pool.query(`UPDATE academic_years SET is_active = (id = $1)`, [yearId]);

  let termId =
    (
      await pool.query<{ id: string }>(
        `SELECT id FROM terms WHERE academic_year_id = $1 AND term_number = 1 ORDER BY created_at DESC LIMIT 1`,
        [yearId],
      )
    ).rows[0]?.id ?? null;
  if (!termId) {
    const term = await pool.query<{ id: string }>(
      `INSERT INTO terms (academic_year_id, term_number, start_date, end_date, is_active)
       VALUES ($1, 1, '2026-02-03', '2026-05-02', true)
       RETURNING id`,
      [yearId],
    );
    termId = term.rows[0]?.id ?? null;
  }
  if (!termId) {
    throw new Error("Could not create or locate term for student seed");
  }
  await pool.query(`UPDATE terms SET is_active = (id = $1)`, [termId]);

  let oLevelClassId =
    (
      await pool.query<{ id: string }>(
        `SELECT id FROM classes
         WHERE name = 'S2' AND stream = 'North' AND level = 'o_level' AND academic_year_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [yearId],
      )
    ).rows[0]?.id ?? null;
  if (!oLevelClassId) {
    const oLevel = await pool.query<{ id: string }>(
      `INSERT INTO classes (name, stream, level, academic_year_id, class_teacher_id)
       VALUES ('S2', 'North', 'o_level', $1, $2)
       RETURNING id`,
      [yearId, classTeacherId],
    );
    oLevelClassId = oLevel.rows[0]?.id ?? null;
  }
  if (!oLevelClassId) {
    throw new Error("Could not create or locate O-Level class for student seed");
  }

  let aLevelClassId =
    (
      await pool.query<{ id: string }>(
        `SELECT id FROM classes
         WHERE name = 'S5' AND stream = 'South' AND level = 'a_level' AND academic_year_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [yearId],
      )
    ).rows[0]?.id ?? null;
  if (!aLevelClassId) {
    const aLevel = await pool.query<{ id: string }>(
      `INSERT INTO classes (name, stream, level, academic_year_id, class_teacher_id)
       VALUES ('S5', 'South', 'a_level', $1, $2)
       RETURNING id`,
      [yearId, classTeacherId],
    );
    aLevelClassId = aLevel.rows[0]?.id ?? null;
  }
  if (!aLevelClassId) {
    throw new Error("Could not create or locate A-Level class for student seed");
  }

  let comboId =
    (await pool.query<{ id: string }>(`SELECT id FROM subject_combinations WHERE code = 'PCM' ORDER BY id LIMIT 1`))
      .rows[0]?.id ?? null;
  if (!comboId) {
    const combo = await pool.query<{ id: string }>(
      `INSERT INTO subject_combinations (code, name, subjects)
       VALUES ('PCM', 'Physics, Chemistry, Mathematics', '["Physics","Chemistry","Mathematics"]'::jsonb)
       RETURNING id`,
    );
    comboId = combo.rows[0]?.id ?? null;
  }
  if (!comboId) {
    throw new Error("Could not create or locate A-Level subject combination for student seed");
  }

  if (subjectTeacherId) {
    await pool.query(
      `INSERT INTO subjects (name, code, level)
       VALUES ('Mathematics', 'MATH-SMS', 'o_level')
       ON CONFLICT (code) DO NOTHING`,
    );
    const subject = await pool.query<{ id: string }>(`SELECT id FROM subjects WHERE code = 'MATH-SMS' LIMIT 1`);
    const subjectId = subject.rows[0]?.id ?? null;
    if (subjectId) {
      await pool.query(
        `INSERT INTO class_subjects (class_id, subject_id, teacher_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (class_id, subject_id) DO UPDATE SET teacher_id = EXCLUDED.teacher_id`,
        [oLevelClassId, subjectId, subjectTeacherId],
      );
    }
  }

  return { classTeacherId, subjectTeacherId, yearId, termId, oLevelClassId, aLevelClassId, comboId };
}

async function seedSampleStudents(refs: RefIds): Promise<void> {
  const students = buildSampleStudents(refs);
  for (const s of students) {
    await pool.query(
      `INSERT INTO students (
        student_number, full_name, date_of_birth, gender, guardian_name, guardian_contact, class_id, combination_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (student_number)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        date_of_birth = EXCLUDED.date_of_birth,
        gender = EXCLUDED.gender,
        guardian_name = EXCLUDED.guardian_name,
        guardian_contact = EXCLUDED.guardian_contact,
        class_id = EXCLUDED.class_id,
        combination_id = EXCLUDED.combination_id,
        status = 'active',
        updated_at = NOW()`,
      [
        s.studentNumber,
        s.fullName,
        s.dateOfBirth,
        s.gender,
        s.guardianName,
        s.guardianContact,
        s.classId,
        s.combinationId,
      ],
    );
    console.log(`Seeded student: ${s.studentNumber} (${s.fullName})`);
  }
}

async function main(): Promise<void> {
  const sharedPassword = process.env.SAMPLE_USERS_PASSWORD ?? process.env.ADMIN_PASSWORD;
  if (!sharedPassword) {
    console.error("Set SAMPLE_USERS_PASSWORD (or ADMIN_PASSWORD) in .env");
    process.exit(1);
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 10);
  const hash = await bcrypt.hash(sharedPassword, rounds);
  const usersToSeed = SAMPLE_USERS.map((item) =>
    item.role === "admin" && adminEmail ? { ...item, email: adminEmail } : item,
  );

  for (const user of usersToSeed) {
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email)
       DO UPDATE SET
         full_name = EXCLUDED.full_name,
         role = EXCLUDED.role,
         is_active = true,
         password_hash = EXCLUDED.password_hash,
         updated_at = NOW()`,
      [user.fullName, user.email.toLowerCase().trim(), hash, user.role],
    );
    console.log(`Seeded user: ${user.email} (${user.role})`);
  }

  const classTeacherId =
    (
      await pool.query<{ id: string }>(
        `SELECT id FROM users WHERE role = 'class_teacher' ORDER BY created_at ASC LIMIT 1`,
      )
    ).rows[0]?.id ?? null;
  const subjectTeacherId =
    (
      await pool.query<{ id: string }>(
        `SELECT id FROM users WHERE role = 'subject_teacher' ORDER BY created_at ASC LIMIT 1`,
      )
    ).rows[0]?.id ?? null;

  const refs = await ensureAcademicBaseline(classTeacherId, subjectTeacherId);
  await seedSampleStudents(refs);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
