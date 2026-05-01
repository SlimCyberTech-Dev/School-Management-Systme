import { ReactNode } from "react";

export function ShellContent({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-0 flex-1 overflow-auto bg-background transition-colors">
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 lg:p-6">{children}</div>
    </main>
  );
}
