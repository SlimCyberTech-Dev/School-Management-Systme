"use client";

import { SchoolUserDetailPage } from "@/components/users/SchoolUserDetailPage";
import { ADMIN_USERS_MODULE } from "@/components/users/usersModuleConfig";

export default function AdminUserDetailPage() {
  return <SchoolUserDetailPage config={ADMIN_USERS_MODULE} />;
}
