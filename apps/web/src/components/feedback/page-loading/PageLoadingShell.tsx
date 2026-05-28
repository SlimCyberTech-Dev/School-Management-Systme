import { ChartSkeletonGrid } from "@/components/feedback/ChartSkeleton";
import { DashboardSkeleton } from "@/components/layout/shells/DashboardScaffold";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { KpiSkeleton } from "@/components/feedback/KpiSkeleton";
import { Skeleton } from "@/components/feedback/Skeleton";
import { TableSkeleton } from "@/components/feedback/TableSkeleton";

export type PageLoadingVariant = "dashboard" | "table" | "form" | "analytics" | "generic";

function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton.Line className="h-8 w-52 max-w-full" />
      <Skeleton.Line className="h-4 w-80 max-w-full" />
    </div>
  );
}

export function PageLoadingShell({
  variant = "table",
  showHeader = true,
}: {
  variant?: PageLoadingVariant;
  showHeader?: boolean;
}) {
  return (
    <div className="space-y-6 p-6" role="status" aria-label="Loading page">
      {showHeader ? <PageHeaderSkeleton /> : null}
      {variant === "dashboard" ? <DashboardSkeleton /> : null}
      {variant === "table" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton.Block className="h-9 w-28" />
            <Skeleton.Block className="h-9 w-32" />
          </div>
          <TableSkeleton rows={8} cols={5} showSearch />
        </div>
      ) : null}
      {variant === "form" ? <FormSkeleton fields={6} /> : null}
      {variant === "analytics" ? (
        <div className="space-y-6">
          <KpiSkeleton />
          <ChartSkeletonGrid count={2} />
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : null}
      {variant === "generic" ? (
        <div className="space-y-3">
          <Skeleton.Block className="h-32 w-full rounded-xl" />
          <Skeleton.Block className="h-48 w-full rounded-xl" />
        </div>
      ) : null}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
