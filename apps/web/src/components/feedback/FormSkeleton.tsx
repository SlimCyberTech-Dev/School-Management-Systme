import { Skeleton } from "@/components/feedback/Skeleton";

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col items-center gap-3">
        <Skeleton.Circle className="h-20 w-20" />
        <Skeleton.Line className="w-40" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton.Line className="w-24" />
            <Skeleton.Block className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton.Block className="h-10 w-32" />
    </div>
  );
}
