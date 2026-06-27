"use client";

import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";

export default function HeadteacherAssessmentHubPage() {
  return (
    <PageWrapper
      title="Assessment oversight"
      description="Use the Assessment menu in the sidebar for competency assessment, A-Level, and formal exam workflows."
    >
      <p className="-mt-2 mb-6 text-sm text-muted-foreground">
        Teachers enter marks on their portals. Use this hub for oversight, report-card approval, and school-wide
        analytics.
      </p>

      <Card title="Quick actions">
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/headteacher/assessment/cbc" className="font-medium text-brand hover:underline">
              Review competency assessments →
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
        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Pre-migration strand sheets:{" "}
          <Link
            href="/headteacher/assessment/cbc#legacy-cbc"
            className="font-medium text-foreground/80 underline-offset-2 hover:text-brand hover:underline"
          >
            unlock legacy CBC sheet
          </Link>{" "}
          (secondary — on the competency page, legacy section)
        </p>
      </Card>
    </PageWrapper>
  );
}
