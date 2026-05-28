"use client";

import { FinancialTermReport } from "@/components/fees/FinancialTermReport";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function BursarFinancialReportsPage() {
  return (
    <PageWrapper
      title="Financial reports"
      description="Term-level billing, collections, and outstanding balances."
    >
      <FinancialTermReport />
    </PageWrapper>
  );
}
