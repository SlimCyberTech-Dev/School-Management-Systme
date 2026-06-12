import { Skeleton } from "@/components/feedback/Skeleton";

export function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex h-[280px] w-full flex-col justify-end rounded-lg border border-border bg-card p-4 ${className}`}
    >
      <div className="mb-3 flex items-end justify-between gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton.Block key={i} className="w-full" style={{ height: `${40 + (i % 3) * 24}%` }} />
        ))}
      </div>
      <Skeleton.Line className="mt-2 w-full" />
    </div>
  );
}

export function ChartSkeletonGrid({ count = 2 }: { count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <ChartSkeleton key={i} />
      ))}
    </div>
  );
}
