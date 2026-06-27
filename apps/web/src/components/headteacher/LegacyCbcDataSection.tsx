"use client";

import { useEffect, useRef } from "react";
import { HeadteacherAssessmentStatusPanel } from "@/components/headteacher/HeadteacherAssessmentStatusPanel";
import type { HeadteacherPeriodValue } from "@/components/headteacher/HeadteacherPeriodFilters";

type Props = {
  onUnlock: (subjectId: string, filters: HeadteacherPeriodValue) => Promise<void>;
};

export function LegacyCbcDataSection({ onUnlock }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#legacy-cbc") return;
    const el = detailsRef.current;
    if (el) el.open = true;
  }, []);

  return (
    <details
      ref={detailsRef}
      id="legacy-cbc"
      className="group mt-10 rounded-xl border border-border bg-muted/20 text-sm shadow-sm"
    >
      <summary className="cursor-pointer list-none px-4 py-3 transition-ui hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
          <span className="inline-flex items-center gap-2 font-semibold text-foreground">
            <span className="text-muted-foreground transition-ui group-open:rotate-90" aria-hidden>
              ▸
            </span>
            Legacy data (pre-migration)
          </span>
          <span className="text-xs font-normal text-muted-foreground sm:ml-6">
            Strand-sheet submission flow — expand only when needed
          </span>
        </span>
      </summary>
      <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
        <p className="text-sm text-muted-foreground">
          Shows progress on the old strand-based submission flow, still used for imported or previously submitted
          strand sheets (including rows mirrored from pre-migration imports). New competency assessment uses the
          Activities &amp; Ratings flow above.
        </p>
        <HeadteacherAssessmentStatusPanel
          embedded
          track="cbc"
          title="Legacy CBC sheet progress"
          description="Subject teachers submitted strand ratings per class–subject under the old flow. Unlock only when correcting a sheet that was already submitted."
          statusPath="/assessments/cbc/status"
          canUnlock
          onUnlock={onUnlock}
        />
      </div>
    </details>
  );
}
