"use client";

import { useSearchParams } from "next/navigation";
import { FeeSchedulePublishBoard } from "@/components/fees/admin/FeeSchedulePublishBoard";

export default function AdminFeesPublishPage() {
  const searchParams = useSearchParams();

  return (
    <FeeSchedulePublishBoard
      initialYearId={searchParams.get("yearId") ?? undefined}
      initialTermId={searchParams.get("termId") ?? undefined}
      initialClassId={searchParams.get("classId") ?? undefined}
    />
  );
}
