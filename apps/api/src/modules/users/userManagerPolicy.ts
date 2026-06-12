import { HEADTEACHER_MANAGEABLE_ROLES, PRIVILEGED_USER_ROLES, type Role } from "@uganda-cbc-sms/shared";
import { query } from "../../config/db";
import { HttpError } from "../../utils/httpError";

export { HEADTEACHER_MANAGEABLE_ROLES, PRIVILEGED_USER_ROLES };

export async function getUserRole(id: string): Promise<Role> {
  const { rows } = await query<{ role: Role }>(
    `SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  if (!rows[0]) throw new HttpError(404, "User not found");
  return rows[0].role;
}

export function isPrivilegedUserRole(role: string): boolean {
  return (PRIVILEGED_USER_ROLES as readonly string[]).includes(role);
}

export function assertHeadteacherCanAssignRole(role: string): void {
  if (!(HEADTEACHER_MANAGEABLE_ROLES as readonly string[]).includes(role)) {
    throw new HttpError(
      403,
      "Headteachers can only manage class teachers, subject teachers, and bursar accounts.",
    );
  }
}

export async function assertActorCanManageUser(
  actor: { id: string; role: string },
  targetUserId: string,
): Promise<void> {
  if (actor.role === "admin") return;
  if (actor.role !== "headteacher") {
    throw new HttpError(403, "Your role does not include access to this area.");
  }
  const targetRole = await getUserRole(targetUserId);
  if (isPrivilegedUserRole(targetRole)) {
    throw new HttpError(403, "Headteachers cannot manage administrator or headteacher accounts.");
  }
}
