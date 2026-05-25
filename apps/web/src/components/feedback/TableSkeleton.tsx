import { Skeleton } from "@/components/feedback/Skeleton";

export function TableSkeleton({
  rows = 5,
  cols = 4,
  showSearch = false,
}: {
  rows?: number;
  cols?: number;
  showSearch?: boolean;
}) {
  return (
    <div className="space-y-3">
      {showSearch ? <Skeleton.Block className="h-10 max-w-sm" /> : null}
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-3 py-2 text-left">
                  <Skeleton.Line className="w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {Array.from({ length: rows }).map((_, ri) => (
              <tr key={ri}>
                {Array.from({ length: cols }).map((_, ci) => (
                  <td key={ci} className="px-3 py-3">
                    <Skeleton.Line className={ci === 0 ? "w-32" : "w-20"} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
