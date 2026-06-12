export function TeacherTimetableSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-9 w-48 rounded-lg bg-muted" />
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-lg bg-muted" />
            <div className="h-9 w-24 rounded-lg bg-muted" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="h-8 w-28 rounded-full bg-muted" />
          <div className="h-8 w-32 rounded-full bg-muted" />
          <div className="h-8 w-28 rounded-full bg-muted" />
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((d) => (
          <div key={d} className="rounded-xl border border-border bg-card p-3">
            <div className="mb-3 h-5 w-20 rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-muted/70" />
              <div className="h-24 rounded-lg bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
