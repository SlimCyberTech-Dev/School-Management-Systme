import { pool } from "./db.js";

/** Superusers and BYPASSRLS roles ignore RLS — school data must use `school_app`. */
export async function assertSchoolDbRoleEnforcesRls(): Promise<void> {
  try {
    const { rows } = await pool.query<{ rolname: string; rolbypassrls: boolean }>(
      `SELECT rolname::text AS rolname, rolbypassrls
       FROM pg_roles
       WHERE rolname = current_user`,
    );
    const role = rows[0];
    if (!role) return;

    if (role.rolbypassrls || role.rolname === "postgres" || role.rolname.endsWith("_superuser")) {
      console.error("");
      console.error("╔══════════════════════════════════════════════════════════════════╗");
      console.error("║  TENANT ISOLATION DISABLED                                       ║");
      console.error("║  DATABASE_URL uses a role that bypasses Row Level Security.        ║");
      console.error("║  All schools will see each other's data.                         ║");
      console.error("║                                                                  ║");
      console.error("║  Fix: npm run setup:db-roles                                     ║");
      console.error("║  Then set DATABASE_URL to school_app in .env                     ║");
      console.error("╚══════════════════════════════════════════════════════════════════╝");
      console.error("");
      if (process.env.NODE_ENV === "production") {
        throw new Error("DATABASE_URL must use school_app (RLS-enforced), not a BYPASSRLS role.");
      }
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("school_app")) throw e;
    /* DB unavailable during tests */
  }
}
