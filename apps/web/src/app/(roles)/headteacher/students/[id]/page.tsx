"use client";

import { useParams } from "next/navigation";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FeeBalanceCard } from "@/components/fees/FeeBalanceCard";
import { Card } from "@/components/ui/Card";
import { useEntityDetail } from "@/hooks/useEntityDetail";

type StudentView = {
  id: string;
  studentNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  guardianName: string;
  guardianContact: string;
  photoUrl: string | null;
  status: string;
};

export default function HeadteacherStudentProfilePage() {
  const params = useParams();
  const id = String(params["id"]);
  const { data: st, status, error, refetch, isFetching, isPending } = useEntityDetail<StudentView>("/students", id);

  return (
    <PageWrapper title="Student profile" description="Learner record">
      <AsyncContent
        status={status === "success" && !st ? "error" : status}
        isFetching={isFetching && !isPending}
        loading={<FormSkeleton />}
        error={
          <ErrorState
            title="Record not found"
            message={error instanceof Error ? error.message : "Could not load this student"}
            onRetry={() => void refetch()}
          />
        }
      >
        {st ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Bio">
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Student #</dt>
                  <dd className="font-medium">{st.studentNumber}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{st.fullName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">DOB / Gender</dt>
                  <dd>
                    {st.dateOfBirth} — {st.gender}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Guardian</dt>
                  <dd>
                    {st.guardianName} ({st.guardianContact})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{st.status}</dd>
                </div>
              </dl>
            </Card>
            <FeeBalanceCard studentId={st.id} />
          </div>
        ) : null}
      </AsyncContent>
    </PageWrapper>
  );
}
