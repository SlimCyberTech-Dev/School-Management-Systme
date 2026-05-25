import { ChartSkeletonGrid } from "@/components/feedback/ChartSkeleton";
import { KpiSkeleton } from "@/components/feedback/KpiSkeleton";

export function ReportsAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <KpiSkeleton />
      <ChartSkeletonGrid count={4} />
    </div>
  );
}
