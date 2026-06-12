"use client";

import { AdminFeesSubNav } from "@/components/fees/admin/AdminFeesSubNav";

export default function AdminFeesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-foreground">Fees management</h1>
        <p className="text-muted-foreground">
          Publish fee schedules so bursars can bill students, configure amounts per class, and monitor collections.
        </p>
      </div>
      <AdminFeesSubNav />
      {children}
    </div>
  );
}
