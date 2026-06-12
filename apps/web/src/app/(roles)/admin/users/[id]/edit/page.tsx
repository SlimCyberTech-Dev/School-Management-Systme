"use client";

import { SchoolUserEditPage } from "@/components/users/SchoolUserEditPage";
import { ADMIN_USERS_MODULE } from "@/components/users/usersModuleConfig";

export default function AdminUsersEditPage() {
  return <SchoolUserEditPage config={ADMIN_USERS_MODULE} />;
}
