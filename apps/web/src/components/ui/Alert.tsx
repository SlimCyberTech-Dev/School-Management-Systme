import type { ReactNode } from "react";

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: ReactNode;
}) {
  const cls =
    tone === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : tone === "error"
        ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
        : "border-border bg-muted text-foreground";
  return <div className={`rounded-md border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}
