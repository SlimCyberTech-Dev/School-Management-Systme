"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Calendar, FileDown } from "lucide-react";
import { AsyncContent } from "@/components/feedback/AsyncContent";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import {
  DashboardHeader,
  DashboardPanel,
  DashboardSkeleton,
  DashboardTwoColumn,
  KpiGrid,
} from "@/components/layout/shells/DashboardScaffold";
import { apiGet } from "@/lib/api";
import { combineQueryStatus } from "@/lib/queryStatus";

type Kpis = { activeStudents: string; totalFeesDue: string; totalFeesPaid: string };
type TermRow = { id: string; termNumber?: number; startDate?: string; endDate?: string; isActive?: boolean };
type InvRow = Record<string, unknown>;

export default function HeadteacherDashboardPage() {
  const [kpisQ, termsQ, invoicesQ] = useQueries({
    queries: [
      { queryKey: ["dashboard-kpis"], queryFn: () => apiGet<Kpis>("/analytics/dashboard") },
      { queryKey: ["terms"], queryFn: () => apiGet<TermRow[]>("/academic/terms") },
      { queryKey: ["fees-invoices"], queryFn: () => apiGet<InvRow[]>("/fees/invoices") },
    ],
  });

  const queries = [kpisQ, termsQ, invoicesQ];
  const status = combineQueryStatus(queries);
  const isFetching = queries.some((q) => q.isFetching && !q.isPending);
  const errorMessage =
    (kpisQ.error ?? termsQ.error ?? invoicesQ.error) instanceof Error
      ? (kpisQ.error ?? termsQ.error ?? invoicesQ.error)!.message
      : "Failed to load dashboard";

  const kpis = kpisQ.data;
  const terms = termsQ.data ?? [];
  const flagged = useMemo(
    () => (invoicesQ.data ?? []).filter((r) => r.is_flagged === true || r["is_flagged"] === true).length,
    [invoicesQ.data],
  );

  const current = terms.find((x) => x.isActive);
  const daysRemaining = (() => {
    if (!current?.endDate) return null;
    const end = new Date(String(current.endDate)).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
  })();

  const metrics = kpis
    ? [
        { label: "Active students", value: kpis.activeStudents, delta: "Enrolled", deltaTone: "positive" as const },
        {
          label: "Fees collected",
          value: kpis.totalFeesPaid,
          helper: `Due ${kpis.totalFeesDue} UGX`,
          delta: "This term",
          deltaTone: "neutral" as const,
        },
        {
          label: "Current term",
          value: current ? `Term ${current.termNumber ?? "?"}` : "Not set",
          delta: current ? "Active" : "Needs setup",
          deltaTone: current ? ("positive" as const) : ("negative" as const),
          helper: daysRemaining !== null ? `${daysRemaining} days remaining` : "Set active term",
        },
        {
          label: "Flagged invoices",
          value: String(flagged),
          delta: flagged > 0 ? "Action needed" : "All clear",
          deltaTone: flagged > 0 ? ("negative" as const) : ("positive" as const),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Headteacher Dashboard"
        description="Academic and financial oversight for school leadership."
      />
      <AsyncContent
        status={status}
        isFetching={isFetching}
        loading={<DashboardSkeleton />}
        error={
          <ErrorState
            message={errorMessage}
            onRetry={() => void Promise.all(queries.map((q) => q.refetch()))}
          />
        }
      >
        <KpiGrid metrics={metrics} />
        <DashboardTwoColumn
          primary={
            <DashboardPanel title="Current terms" subtitle="Academic calendar status">
              <div className="mb-3 flex items-center justify-end">
                <button
                  type="button"
                  className="transition-ui inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50"
                >
                  <FileDown className="h-4 w-4 stroke-[1.5]" />
                  Export
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Term
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Start
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        End
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {terms.length ? (
                      terms.map((term) => (
                        <tr
                          key={term.id}
                          className="transition-ui border-t border-border/50 hover:bg-muted/40 dark:hover:bg-muted/30"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                            Term {term.termNumber ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            {term.startDate ? new Date(term.startDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                            {term.endDate ? new Date(term.endDate).toLocaleDateString() : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                term.isActive
                                  ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {term.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-0">
                          <EmptyState
                            title="No terms configured"
                            description="Ask admin to set up academic years and terms."
                            icon={Calendar}
                            action={{ label: "View academic hub", href: "/headteacher/academic" }}
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardPanel>
          }
          secondary={
            <DashboardPanel title="Leadership actions">
              <div className="space-y-2 text-sm">
                <Link href="/headteacher/reports" className="block text-blue-600 hover:underline dark:text-blue-400">
                  Review report cards
                </Link>
                <Link
                  href="/headteacher/assessment/cbc/unlock"
                  className="block text-blue-600 hover:underline dark:text-blue-400"
                >
                  Unlock CBC assessments
                </Link>
                <Link href="/headteacher/analytics" className="block text-blue-600 hover:underline dark:text-blue-400">
                  Open analytics
                </Link>
              </div>
            </DashboardPanel>
          }
        />
      </AsyncContent>
    </div>
  );
}
