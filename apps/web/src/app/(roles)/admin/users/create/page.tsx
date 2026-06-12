"use client";

import { SchoolUserCreatePage } from "@/components/users/SchoolUserCreatePage";
import { ADMIN_USERS_MODULE } from "@/components/users/usersModuleConfig";

export default function AdminUsersCreatePage() {
  return <SchoolUserCreatePage config={ADMIN_USERS_MODULE} />;
}
