import { Skeleton } from "@/components/feedback/Skeleton";

export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, idx) => (
        <article key={idx} className="rounded-xl border border-border bg-card p-4">
          <Skeleton.Line className="w-20" />
          <Skeleton.Block className="mt-3 h-8 w-16" />
          <Skeleton.Line className="mt-3 w-12" />
        </article>
      ))}
    </section>
  );
}
