"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CurriculumSetupPanel } from "@/components/academic/CurriculumSetupPanel";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function AdminCurriculumSetupPage() {
  const searchParams = useSearchParams();
  const initialYearId = searchParams.get("academicYearId") ?? "";

  return (
    <PageWrapper
      title="Curriculum setup"
      description="Automate O-Level and A-Level subject catalogues, CBC strands, and class–subject slots"
    >
      <div className="mb-3">
        <Link href="/admin/academic" className="text-sm font-medium text-brand hover:underline">
          ← Back to Academic
        </Link>
      </div>
      <CurriculumSetupPanel initialYearId={initialYearId} />
    </PageWrapper>
  );
}
