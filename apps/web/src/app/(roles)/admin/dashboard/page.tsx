"use client";

import { useQuery } from "@tanstack/react-query";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AdminDashboardContent } from "@/components/admin/AdminDashboardContent";
import { DashboardSkeleton } from "@/components/layout/shells/DashboardScaffold";
import { apiGet } from "@/lib/api";
import { queryKeys, STRUCTURAL_STALE_MS } from "@/lib/queryKeys";
import { getApiTenantSlug } from "@/lib/tenantHost";
import { combineQueryStatus } from "@/lib/queryStatus";

export type DashboardKpis = {
  activeStudents: string;
  totalFeesDue: string;
  totalFeesPaid: string;
  teacherCount: number;
  recentStudents: Array<{
    id: string;
    studentNumber: string;
    fullName: string;
    enrolledAt: string;
  }>;
};

export default function AdminDashboardPage() {
  const tenantSlug = getApiTenantSlug();
  const kpisQ = useQuery({
    queryKey: queryKeys.dashboardKpis(tenantSlug),
    queryFn: () => apiGet<DashboardKpis>("/analytics/dashboard"),
    staleTime: STRUCTURAL_STALE_MS,
  });

  const status = combineQueryStatus([kpisQ]);
  const isFetching = kpisQ.isFetching && !kpisQ.isPending;
  const errorMessage =
    kpisQ.error instanceof Error ? kpisQ.error.message : "Failed to load dashboard";

  return (
    <AsyncContent
      status={status}
      isFetching={isFetching}
      loading={<DashboardSkeleton />}
      error={
        <ErrorState message={errorMessage} onRetry={() => void kpisQ.refetch()} />
      }
    >
      {kpisQ.data ? (
        <AdminDashboardContent
          kpis={kpisQ.data}
          teacherCount={kpisQ.data.teacherCount}
          recentStudents={kpisQ.data.recentStudents}
        />
      ) : null}
    </AsyncContent>
  );
}
