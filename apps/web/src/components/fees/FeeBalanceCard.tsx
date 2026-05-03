"use client";

import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { apiGet } from "@/lib/api";

export function FeeBalanceCard({ studentId }: { studentId: string }) {
  const [balance, setBalance] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const r = await apiGet<{ totalBalance: string }>(
          `/fees/balance/${encodeURIComponent(studentId)}`,
        );
        setBalance(r.totalBalance);
        setErr(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load balance");
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  return (
    <Card title="Fee balance">
      {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {err ? <Alert tone="error">{err}</Alert> : null}
      {!loading && !err ? (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Current balance</p>
          <p className="text-2xl font-semibold text-brand">{balance} UGX</p>
        </div>
      ) : null}
    </Card>
  );
}
