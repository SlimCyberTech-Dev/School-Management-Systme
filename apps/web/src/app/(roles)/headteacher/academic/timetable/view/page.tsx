"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HeadteacherTimetableViewRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/headteacher/academic/timetable?tab=view");
  }, [router]);
  return <p className="p-6 text-sm text-muted-foreground">Redirecting…</p>;
}
