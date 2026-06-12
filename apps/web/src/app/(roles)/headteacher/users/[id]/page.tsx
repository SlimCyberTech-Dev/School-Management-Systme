"use client";

import { SchoolUserDetailPage } from "@/components/users/SchoolUserDetailPage";
import { HEADTEACHER_USERS_MODULE } from "@/components/users/usersModuleConfig";

export default function HeadteacherUserDetailPage() {
  return <SchoolUserDetailPage config={HEADTEACHER_USERS_MODULE} />;
}
