"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { UsersModuleConfig } from "@/components/users/usersModuleConfig";
import { ResetPasswordModal } from "@/components/users/ResetPasswordModal";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiGet, apiPatch } from "@/lib/api";

type UserDetails = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  systemAccount: boolean;
  notes: string | null;
  loginAttempts: number;
  forcePasswordChange: boolean;
  lastLoginAt: string | null;
  lockedUntil: string | null;
};

type AuditLog = {
  id: string;
  actorName?: string | null;
  action: string;
  createdAt?: string;
  metadata?: Record<string, unknown> | null;
};

function roleLabel(role: string) {
  return role.replace(/_/g, " ");
}

export function SchoolUserDetailPage({ config }: { config: UsersModuleConfig }) {
  const params = useParams();
  const id = String(params["id"]);
  const { usersBasePath, notesLabel = "Notes" } = config;

  const [user, setUser] = useState<UserDetails | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [tab, setTab] = useState<"details" | "audit">("details");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const [u, l] = await Promise.all([
      apiGet<UserDetails>(`/users/${encodeURIComponent(id)}`),
      apiGet<AuditLog[]>(`/users/${encodeURIComponent(id)}/audit-logs`),
    ]);
    setUser(u);
    setNotes(u.notes ?? "");
    setLogs(l);
  };

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Failed to load user"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const quickAction = async (action: "activate" | "deactivate" | "unlock") => {
    setBusy(true);
    setError(null);
    try {
      await apiPatch(`/users/${encodeURIComponent(id)}/${action}`);
      await load();
      setOk(`User ${action}d successfully.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const saveNotes = async () => {
    setBusy(true);
    setError(null);
    try {
      await apiPatch(`/users/${encodeURIComponent(id)}/notes`, { notes });
      setOk("Notes updated.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save notes");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageWrapper title="User Profile" description="Account details and audit history">
      <div className="mb-3">
        <Link href={usersBasePath} className="text-sm font-medium text-brand hover:underline">
          ← Back to Users
        </Link>
      </div>
      {ok ? <Alert tone="success">{ok}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}
      {!user ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          <Card title={user.fullName}>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone="success">{roleLabel(user.role)}</Badge>
              <Badge tone={user.isActive ? "success" : "warning"}>{user.isActive ? "Active" : "Inactive"}</Badge>
              {user.lockedUntil ? <Badge tone="warning">Locked</Badge> : null}
              {user.systemAccount ? <Badge tone="success">System Account</Badge> : null}
              {user.forcePasswordChange ? <Badge tone="warning">Force Password Change</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.isActive ? (
                <Button loading={busy} disabled={user.systemAccount} onClick={() => void quickAction("deactivate")}>
                  Deactivate
                </Button>
              ) : (
                <Button loading={busy} onClick={() => void quickAction("activate")}>
                  Activate
                </Button>
              )}
              <Button variant="secondary" loading={busy} onClick={() => void quickAction("unlock")}>
                Unlock
              </Button>
              <Button variant="secondary" onClick={() => setShowReset(true)}>
                Reset Password
              </Button>
              <Link href={`${usersBasePath}/${user.id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button variant={tab === "details" ? "primary" : "secondary"} onClick={() => setTab("details")}>
              Account Details
            </Button>
            <Button variant={tab === "audit" ? "primary" : "secondary"} onClick={() => setTab("audit")}>
              Audit History
            </Button>
          </div>

          {tab === "details" ? (
            <Card title="Operational Details">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <p>Last login: {user.lastLoginAt ?? "Never"}</p>
                <p>Failed attempts: {user.loginAttempts}</p>
                <p>Locked until: {user.lockedUntil ?? "Not locked"}</p>
              </div>
              <div className="mt-4 space-y-2">
                <Input label={notesLabel} value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Button loading={busy} onClick={() => void saveNotes()}>
                  Save notes
                </Button>
              </div>
            </Card>
          ) : (
            <Card title="Audit History">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="rounded border border-border p-2 text-sm">
                    <p className="font-medium">{log.action}</p>
                    <p className="text-muted-foreground">
                      {log.actorName ?? "System"} • {log.createdAt ?? ""}
                    </p>
                  </div>
                ))}
                {logs.length === 0 ? <p className="text-muted-foreground">No audit logs yet.</p> : null}
              </div>
            </Card>
          )}
        </div>
      )}
      <ResetPasswordModal
        open={showReset}
        onClose={() => setShowReset(false)}
        onSubmit={(payload) => apiPatch(`/users/${encodeURIComponent(id)}/reset-password`, payload)}
      />
    </PageWrapper>
  );
}
