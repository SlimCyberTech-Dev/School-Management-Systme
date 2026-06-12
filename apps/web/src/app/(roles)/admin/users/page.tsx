"use client";

import { SchoolUsersListPage } from "@/components/users/SchoolUsersListPage";
import { ADMIN_USERS_MODULE } from "@/components/users/usersModuleConfig";

export default function AdminUsersListPage() {
  return <SchoolUsersListPage config={ADMIN_USERS_MODULE} />;
}
