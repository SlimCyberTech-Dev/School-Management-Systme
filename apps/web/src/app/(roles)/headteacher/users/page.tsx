"use client";

import { SchoolUsersListPage } from "@/components/users/SchoolUsersListPage";
import { HEADTEACHER_USERS_MODULE } from "@/components/users/usersModuleConfig";

export default function HeadteacherUsersPage() {
  return <SchoolUsersListPage config={HEADTEACHER_USERS_MODULE} />;
}
