"use client";

import { useEffect, useState } from "react";
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
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load balance");
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  return (
    <Card title="Fee balance">
      {loading ? <p className="text-slate-600">Loading…</p> : null}
      {err ? <p className="text-red-600">{err}</p> : null}
      {!loading && !err ? (
        <p className="text-2xl font-semibold text-brand">{balance} UGX</p>
      ) : null}
    </Card>
  );
}
