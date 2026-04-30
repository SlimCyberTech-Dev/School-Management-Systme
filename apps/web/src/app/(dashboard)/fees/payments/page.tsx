"use client";

import { useState } from "react";
import { PaymentForm } from "@/components/fees/PaymentForm";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function FeesPaymentsPage() {
  const [studentId, setStudentId] = useState("");
  const [active, setActive] = useState<string | null>(null);

  return (
    <PageWrapper title="Record payment" description="Bursar — record fee payment against an invoice">
      <div className="mb-6 flex max-w-xl flex-wrap items-end gap-2">
        <Input label="Student ID (UUID)" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
        <Button onClick={() => setActive(studentId)}>Load</Button>
      </div>
      {active ? <PaymentForm studentId={active} /> : null}
    </PageWrapper>
  );
}
