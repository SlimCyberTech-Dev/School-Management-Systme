"use client";

import { usePathname } from "next/navigation";
import { AssessmentGuidePromo } from "@/components/assessment/guide/AssessmentGuidePage";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TeacherAssessmentAssignmentsList } from "@/components/assessment/TeacherAssessmentAssignmentsList";

export default function SubjectTeacherProjectWorkPage() {
  const pathname = usePathname();
  const viewerRole = pathname.includes("/class-teacher/") ? "class-teacher" : "subject-teacher";

  return (
    <PageWrapper
      title="Project work"
      description="Official continuous assessment project scores — blended into term grades when enabled by your school policy."
    >
      <AssessmentGuidePromo viewerRole={viewerRole} className="mb-4" />
      <TeacherAssessmentAssignmentsList
        track="project-work"
        emptyTitle="No assignments"
        emptyDescription="When you are assigned to teach a subject on a class timetable, it will appear here for project work entry."
      />
    </PageWrapper>
  );
}
