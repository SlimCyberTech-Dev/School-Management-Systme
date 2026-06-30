"use client";

import Link from "next/link";
import { AssessmentGuidePromo } from "@/components/assessment/guide/AssessmentGuidePage";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";

export default function HeadteacherAssessmentHubPage() {
  return (
    <PageWrapper
      title="Assessment oversight"
      description="Monitor exam marking and approve term report cards."
    >
      <AssessmentGuidePromo viewerRole="headteacher" className="mb-6" />
      <p className="-mt-2 mb-6 text-sm text-muted-foreground">
        Teachers enter exam marks on their portals. Use this hub for oversight and report-card approval.
      </p>

      <Card title="Quick actions">
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/headteacher/exams" className="font-medium text-brand hover:underline">
              Review formal exams →
            </Link>
          </li>
          <li>
            <Link href="/headteacher/reports" className="font-medium text-brand hover:underline">
              Review and approve report cards →
            </Link>
          </li>
          <li>
            <Link href="/headteacher/analytics" className="font-medium text-brand hover:underline">
              School-wide analytics →
            </Link>
          </li>
        </ul>
      </Card>
    </PageWrapper>
  );
}
