"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserPublic } from "@uganda-cbc-sms/shared";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Table, type Column } from "@/components/ui/Table";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";

type UserTableRow = UserPublic & Record<string, unknown>;
const ACTION_BTN =
  "inline-flex items-center rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground transition-ui hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50";
const ACTION_DANGER_BTN =
  "inline-flex items-center rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 transition-ui hover:bg-red-500/20 dark:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminUsersListPage() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserPublic | null>(null);

  const loadUsers = async () => {
    setErr(null);
    try {
      const r = await apiGet<UserPublic[]>("/users");
      setUsers(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const toggleActive = async (user: UserPublic) => {
    setErr(null);
    setOk(null);
    setBusyUserId(user.id);
    try {
      await apiPatch(`/users/${encodeURIComponent(user.id)}`, { isActive: !user.isActive });
      await loadUsers();
      setOk(`User ${user.isActive ? "deactivated" : "activated"} successfully.`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setBusyUserId(null);
    }
  };

  const deleteUser = async (user: UserPublic) => {
    setErr(null);
    setOk(null);
    setBusyUserId(user.id);
    try {
      await apiDelete(`/users/${encodeURIComponent(user.id)}`);
      setConfirmDelete(null);
      await loadUsers();
      setOk("User deleted successfully.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete user");
    } finally {
      setBusyUserId(null);
    }
  };

  const columns: Column<UserTableRow>[] = [
    { key: "fullName", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (r) => <Badge tone="success">{r.role.replace(/_/g, " ")}</Badge>,
    },
    {
      key: "isActive",
      header: "Active",
      render: (r) => (
        <Badge tone={r.isActive ? "success" : "warning"}>{r.isActive ? "Yes" : "No"}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex flex-wrap gap-3">
          <Link className={ACTION_BTN} href={`/admin/users/${r.id}/edit`}>
            Edit
          </Link>
          <button
            type="button"
            className={ACTION_BTN}
            disabled={busyUserId === r.id}
            onClick={() => void toggleActive(r)}
          >
            {r.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            className={ACTION_DANGER_BTN}
            disabled={busyUserId === r.id}
            onClick={() => setConfirmDelete(r)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageWrapper title="Users" description="Staff accounts">
      <div className="mb-4 flex justify-end">
        <Link href="/admin/users/create">
          <Button>Create user</Button>
        </Link>
      </div>
      <div className="mb-4 space-y-2">
        {ok ? <Alert tone="success">{ok}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>
      <Card title={`Accounts (${users.length})`}>
        <Table
          columns={columns}
          rows={users as UserTableRow[]}
          loading={loading}
          searchKeys={["fullName", "email"]}
        />
      </Card>
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete user account?"
        description={
          confirmDelete
            ? `This will remove ${confirmDelete.fullName} from active staff accounts.`
            : "This will remove the user from active staff accounts."
        }
        confirmLabel="Delete"
        danger
        loading={Boolean(confirmDelete && busyUserId === confirmDelete.id)}
        onCancel={() => {
          if (!busyUserId) setConfirmDelete(null);
        }}
        onConfirm={() => {
          if (confirmDelete) void deleteUser(confirmDelete);
        }}
      />
    </PageWrapper>
  );
}
