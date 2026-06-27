"use client";

import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HeadteacherTermSummaryPanel } from "@/components/cbc/HeadteacherTermSummaryPanel";

export default function AdminCbcAssessmentPage() {
  return (
    <PageWrapper
      title="CBC assessment"
      description="Read-only oversight of NCDC term competency summaries (4-level descriptors)"
    >
      <Link href="/admin/assessment" className="mb-4 inline-block text-sm font-medium text-brand hover:underline">
        ← Assessment hub
      </Link>
      <HeadteacherTermSummaryPanel allowOverride={false} />
    </PageWrapper>
  );
}
