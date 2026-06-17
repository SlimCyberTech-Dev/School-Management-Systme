"use client";

import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";

export default function AdminAssessmentHubPage() {
  return (
    <PageWrapper
      title="Assessment"
      description="Use the Assessment menu in the sidebar for CBC, A-Level, and formal exam workflows."
    >
      <p className="-mt-2 mb-6 text-sm text-muted-foreground">
        <strong className="font-medium text-foreground">Term assessment</strong> (CBC competencies or A-Level
        scores) feeds report cards across the term. <strong className="font-medium text-foreground">Formal exams</strong>{" "}
        are one-off papers with their own lifecycle and teacher marking queue.
      </p>

      <Card title="Grading scales">
        <p className="text-sm text-muted-foreground">
          O-Level CBC uses A–E competency bands and{" "}
          <Link href="/admin/assessment/rules" className="font-medium text-brand hover:underline">
            Assessment rules
          </Link>{" "}
          for CA conversion. Bands are configured under{" "}
          <Link href="/admin/academic/grading-scales" className="font-medium text-brand hover:underline">
            Academic → Grading scales
          </Link>
          . A-Level numeric grades and UNEB points use the same page (A-Level tab).
        </p>
      </Card>
    </PageWrapper>
  );
}
