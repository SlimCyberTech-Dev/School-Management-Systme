import "dotenv/config";
import { pool } from "../src/config/db";
import { recalculateTermGrades } from "../src/utils/termSubjectGrade";

/**
 * Recomputes O-Level term subject grades from compulsory exam marks and project work.
 *
 * Usage:
 *   npm run recalculate:olevel-grades
 *   npm run recalculate:olevel-grades -- --termId=<uuid> --classId=<uuid> --studentId=<uuid>
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const termId = args.find((a) => a.startsWith("--termId="))?.split("=")[1];
  const classId = args.find((a) => a.startsWith("--classId="))?.split("=")[1];
  const studentId = args.find((a) => a.startsWith("--studentId="))?.split("=")[1];

  if (!termId) {
    console.error("--termId is required.");
    process.exit(1);
  }

  const result = await recalculateTermGrades({ termId, classId, studentId });

  console.log(
    `Recalculated term grades for ${result.scanned} student(s); ${result.updated} subject row(s) updated.`,
  );
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
