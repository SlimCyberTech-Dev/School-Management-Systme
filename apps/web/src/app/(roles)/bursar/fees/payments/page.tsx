"use client";

import { useState } from "react";
import { PaymentForm } from "@/components/fees/PaymentForm";
import { StudentSearchPicker, type PickedStudent } from "@/components/fees/StudentSearchPicker";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";

export default function BursarRecordPaymentPage() {
  const [student, setStudent] = useState<PickedStudent | null>(null);

  return (
    <PageWrapper
      title="Record payment"
      description="Search for a student, select an open invoice, and issue an official receipt."
    >
      <Card title="Student">
        <StudentSearchPicker selected={student} onSelect={setStudent} />
      </Card>
      {student ? (
        <Card title={`Payment — ${student.fullName}`}>
          <PaymentForm studentId={student.id} />
        </Card>
      ) : null}
    </PageWrapper>
  );
}
