/** CSS-only product preview for the home hero — no stock imagery */
export function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="absolute -right-4 top-8 h-40 w-40 rounded-full bg-brand/10 blur-3xl dark:bg-brand/20" />
      <div className="absolute -left-6 bottom-4 h-32 w-32 rounded-full bg-accent/10 blur-3xl dark:bg-accent/20" />

      <div className="relative space-y-3">
        <div className="surface-card ml-auto w-[88%] p-4 shadow-elevated">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-caption text-brand-dark dark:bg-brand-dark/50 dark:text-green-200">
              O-Level · CBC
            </span>
            <span className="text-caption text-muted-foreground">S3 Term 2</span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-small">
              <span className="text-muted-foreground">Mathematics</span>
              <span className="font-semibold text-brand">B · Satisfactory</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-4/5 rounded-full bg-brand" />
            </div>
            <div className="flex justify-between text-caption text-muted-foreground">
              <span>CA 72%</span>
              <span>EOC 68%</span>
            </div>
          </div>
        </div>

        <div className="surface-card w-[92%] p-4 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full bg-accent-light px-2 py-0.5 text-caption text-accent-deep dark:bg-accent-deep/50 dark:text-blue-200">
              A-Level · UNEB
            </span>
            <span className="text-caption text-muted-foreground">S6</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { subj: "PHY", grade: "B", pts: "2" },
              { subj: "CHE", grade: "C", pts: "3" },
              { subj: "MTH", grade: "A", pts: "1" },
            ].map((row) => (
              <div key={row.subj} className="rounded-md bg-muted/60 px-2 py-2 dark:bg-muted/40">
                <p className="text-caption text-muted-foreground">{row.subj}</p>
                <p className="font-display text-heading-3 text-accent">{row.grade}</p>
                <p className="text-caption text-muted-foreground">{row.pts} pt</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-right text-small font-semibold text-foreground">Division II</p>
        </div>

        <div className="surface-card ml-6 w-[78%] border-dashed p-3">
          <p className="text-caption text-muted-foreground">Fees · UGX</p>
          <p className="font-display text-heading-3 text-foreground">Balance cleared</p>
        </div>
      </div>
    </div>
  );
}
