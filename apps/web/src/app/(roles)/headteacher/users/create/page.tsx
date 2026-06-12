"use client";

import { SchoolUserCreatePage } from "@/components/users/SchoolUserCreatePage";
import { HEADTEACHER_USERS_MODULE } from "@/components/users/usersModuleConfig";

export default function HeadteacherUsersCreatePage() {
  return <SchoolUserCreatePage config={HEADTEACHER_USERS_MODULE} />;
}
