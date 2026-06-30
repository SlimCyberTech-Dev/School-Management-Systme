"use client";

import { usePathname } from "next/navigation";
import { AssessmentGuidePromo } from "@/components/assessment/guide/AssessmentGuidePage";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherAssessmentAssignmentsList } from "@/components/assessment/TeacherAssessmentAssignmentsList";

export default function SubjectTeacherCbcListPage() {
  const pathname = usePathname();
  const viewerRole = pathname.includes("/class-teacher/") ? "class-teacher" : "subject-teacher";

  return (
    <PageWrapper
      title="Competency assessment"
      description="UNEB A–E competency ratings via assessment activities. Formal exams are under Exams."
    >
      <AssessmentGuidePromo viewerRole={viewerRole} className="mb-4" />
      <TeacherAssessmentAssignmentsList
        track="cbc"
        emptyTitle="No competency assignments"
        emptyDescription="When you are assigned to teach a subject on a class timetable, it will appear here for term assessment entry."
      />
    </PageWrapper>
  );
}
