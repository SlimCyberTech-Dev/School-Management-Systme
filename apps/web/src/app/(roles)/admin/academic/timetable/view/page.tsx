"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Legacy route — redirects to the View published tab on the main timetable page. */
export default function TimetableViewRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/academic/timetable?tab=view");
  }, [router]);
  return <p className="p-6 text-sm text-muted-foreground">Redirecting…</p>;
}
