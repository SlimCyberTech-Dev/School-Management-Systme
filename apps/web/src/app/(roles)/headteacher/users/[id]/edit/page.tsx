"use client";

import { SchoolUserEditPage } from "@/components/users/SchoolUserEditPage";
import { HEADTEACHER_USERS_MODULE } from "@/components/users/usersModuleConfig";

export default function HeadteacherUsersEditPage() {
  return <SchoolUserEditPage config={HEADTEACHER_USERS_MODULE} />;
}
