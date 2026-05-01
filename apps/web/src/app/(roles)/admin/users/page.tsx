"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { UserPublic } from "@uganda-cbc-sms/shared";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Table, type Column } from "@/components/ui/Table";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";

type UserTableRow = UserPublic & Record<string, unknown>;

export default function AdminUsersListPage() {
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [err, setErr] = useState<string | null>(null);
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
    setBusyUserId(user.id);
    try {
      await apiPatch(`/users/${encodeURIComponent(user.id)}`, { isActive: !user.isActive });
      await loadUsers();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update user");
    } finally {
      setBusyUserId(null);
    }
  };

  const deleteUser = async (user: UserPublic) => {
    setErr(null);
    setBusyUserId(user.id);
    try {
      await apiDelete(`/users/${encodeURIComponent(user.id)}`);
      setConfirmDelete(null);
      await loadUsers();
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
          <Link className="text-brand underline" href={`/admin/users/${r.id}/edit`}>
            Edit
          </Link>
          <button
            type="button"
            className="text-brand underline disabled:opacity-50"
            disabled={busyUserId === r.id}
            onClick={() => void toggleActive(r)}
          >
            {r.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            className="text-red-600 underline disabled:opacity-50"
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
      {err ? <p className="text-red-600">{err}</p> : null}
      <Card title={`Accounts (${users.length})`}>
        <Table
          columns={columns}
          rows={users as UserTableRow[]}
          loading={loading}
          searchKeys={["fullName", "email"]}
        />
      </Card>
      <Modal
        open={Boolean(confirmDelete)}
        title="Delete user account?"
        onClose={() => {
          if (!busyUserId) setConfirmDelete(null);
        }}
      >
        <p className="mb-4 text-sm text-muted-foreground">
          {confirmDelete
            ? `This will remove ${confirmDelete.fullName} from active staff accounts.`
            : "This will remove the user from active staff accounts."}
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={Boolean(busyUserId)}
            onClick={() => setConfirmDelete(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
            loading={Boolean(confirmDelete && busyUserId === confirmDelete.id)}
            onClick={() => {
              if (confirmDelete) void deleteUser(confirmDelete);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </PageWrapper>
  );
}
