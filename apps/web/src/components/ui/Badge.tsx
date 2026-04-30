import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const cls =
    tone === "success"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "warning"
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}
