import { ReactNode } from "react";

export function ShellContent({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-0 flex-1 overflow-auto bg-slate-50">
      <div className="mx-auto w-full max-w-7xl p-4 lg:p-6">{children}</div>
    </main>
  );
}
