"use client";

import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EnrolmentForm } from "@/components/students/EnrolmentForm";

export default function EnrolPage() {
  const router = useRouter();
  return (
    <PageWrapper title="Enrol student" description="Admin — create a new student record">
      <EnrolmentForm
        onCreated={(id) => {
          router.push(`/students/${id}`);
        }}
      />
    </PageWrapper>
  );
}
