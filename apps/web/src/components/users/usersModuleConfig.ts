import { HEADTEACHER_MANAGEABLE_ROLES, ROLES, type Role } from "@uganda-cbc-sms/shared";

export type UsersModuleConfig = {
  usersBasePath: string;
  studentsHref: string;
  assignableRoles: readonly Role[];
  notesLabel?: string;
  showAssignmentLinks?: boolean;
  classTeachersHref?: (teacherId: string) => string;
  subjectTeachersHref?: (teacherId: string) => string;
};

export const ADMIN_USERS_MODULE: UsersModuleConfig = {
  usersBasePath: "/admin/users",
  studentsHref: "/admin/students",
  assignableRoles: ROLES,
  notesLabel: "Admin notes",
  showAssignmentLinks: true,
  classTeachersHref: (id) =>
    `/admin/academic/class-teachers?teacherId=${encodeURIComponent(id)}&view=teacher`,
  subjectTeachersHref: (id) =>
    `/admin/academic/teacher-assignments?teacherId=${encodeURIComponent(id)}`,
};

export const HEADTEACHER_USERS_MODULE: UsersModuleConfig = {
  usersBasePath: "/headteacher/users",
  studentsHref: "/headteacher/students",
  assignableRoles: HEADTEACHER_MANAGEABLE_ROLES,
  notesLabel: "Notes",
  showAssignmentLinks: false,
};
