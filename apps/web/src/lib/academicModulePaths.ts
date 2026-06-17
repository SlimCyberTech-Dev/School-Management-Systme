/** Academic workflow base path for admin or headteacher shells. */
export function getAcademicBasePath(pathname: string): string {
  if (pathname.startsWith("/headteacher/academic")) return "/headteacher/academic";
  return "/admin/academic";
}

export function academicSegment(basePath: string, segment: string): string {
  const normalized = segment.startsWith("/") ? segment : `/${segment}`;
  return `${basePath}${normalized}`;
}

export type AcademicModuleConfig = {
  basePath: string;
  academicHubPath: string;
  usersBasePath?: string;
};

export const ADMIN_ACADEMIC_MODULE: AcademicModuleConfig = {
  basePath: "/admin/academic",
  academicHubPath: "/admin/academic",
  usersBasePath: "/admin/users",
};

export const HEADTEACHER_ACADEMIC_MODULE: AcademicModuleConfig = {
  basePath: "/headteacher/academic",
  academicHubPath: "/headteacher/academic",
  usersBasePath: "/headteacher/users",
};
