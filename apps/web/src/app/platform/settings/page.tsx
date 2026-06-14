"use client";

import { useCallback, useEffect, useState } from "react";
import {
  KeyRound,
  Lock,
  Shield,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { PlatformModal } from "@/components/platform/PlatformModal";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { platformApiError } from "@/components/platform/platformUtils";
import {
  platformBtnPrimary,
  platformBtnSecondary,
  platformCardClass,
  platformInputClass,
  platformLabelClass,
} from "@/components/platform/platformFieldStyles";
import { platformApi } from "@/lib/platformApi";
import { sessionInactivityMinutes } from "@/lib/sessionConfig";
import { toast } from "@/lib/toast";
import { usePlatformStore } from "@/store/platformStore";

type PlatformOperator = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type Tab = "security" | "team";

const CREATE_FORM_ID = "create-platform-admin-form";

export default function PlatformSettingsPage() {
  const currentAdmin = usePlatformStore((s) => s.admin);
  const setToken = usePlatformStore((s) => s.setToken);
  const [tab, setTab] = useState<Tab>("security");
  const [operators, setOperators] = useState<PlatformOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<PlatformOperator | null>(null);
  const [newOperatorCreds, setNewOperatorCreds] = useState<{
    email: string;
    fullName: string;
    temporaryPassword: string;
  } | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    autoPassword: true,
  });

  const loadOperators = useCallback(async () => {
    try {
      const res = await platformApi.get("/admins");
      setOperators(res.data?.data ?? []);
    } catch (e) {
      toast.error(platformApiError(e) ?? "Could not load operators.", "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOperators();
  }, [loadOperators]);

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.", "Validation");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.", "Validation");
      return;
    }
    setSubmitting(true);
    try {
      const res = await platformApi.patch("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      const data = res.data?.data as {
        token?: string;
        session?: { inactivityMinutes: number; idleExpiresAt: string };
      };
      if (data?.token) {
        setToken(data.token, data.session);
      }
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Your password has been updated.", "Security");
    } catch (e) {
      toast.error(platformApiError(e) ?? "Could not update password.", "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function onCreateOperator(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
      };
      if (!createForm.autoPassword && createForm.password.trim()) {
        body.password = createForm.password.trim();
      }
      const res = await platformApi.post("/admins", body);
      const data = res.data?.data as {
        admin: PlatformOperator;
        temporaryPassword?: string;
      };
      await loadOperators();
      setCreateOpen(false);
      setCreateForm({ fullName: "", email: "", password: "", autoPassword: true });
      if (data?.temporaryPassword) {
        setNewOperatorCreds({
          email: data.admin.email,
          fullName: data.admin.fullName,
          temporaryPassword: data.temporaryPassword,
        });
      } else {
        toast.success(`${data.admin.fullName} can now sign in.`, "Operator added");
      }
    } catch (e) {
      toast.error(platformApiError(e) ?? "Could not add operator.", "Error");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    setSubmitting(true);
    try {
      await platformApi.post(`/admins/${deactivateTarget.id}/deactivate`);
      toast.success(`${deactivateTarget.fullName} has been deactivated.`, "Team");
      setDeactivateTarget(null);
      await loadOperators();
    } catch (e) {
      toast.error(platformApiError(e) ?? "Could not deactivate operator.", "Error");
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Shield }[] = [
    { id: "security", label: "Security", icon: Shield },
    { id: "team", label: "Team", icon: Users },
  ];

  return (
    <PlatformShell
      title="Settings"
      subtitle="Manage your account and platform operators"
    >
      <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-500/40"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {tab === "security" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={platformCardClass}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <KeyRound className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-white">Change password</h2>
                <p className="text-sm text-slate-400">All other sessions will be signed out.</p>
              </div>
            </div>
            <form onSubmit={onChangePassword} className="space-y-4">
              <label className={platformLabelClass}>
                Current password
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className={platformInputClass}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                  }
                />
              </label>
              <label className={platformLabelClass}>
                New password
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={platformInputClass}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                />
              </label>
              <label className={platformLabelClass}>
                Confirm new password
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className={platformInputClass}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className={platformBtnPrimary}
              >
                {submitting ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>

          <section className={platformCardClass}>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Lock className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-white">Session policy</h2>
                <p className="text-sm text-slate-400">How your platform sessions are protected</p>
              </div>
            </div>
            <dl className="space-y-4">
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Signed in as
                </dt>
                <dd className="mt-1 text-sm font-medium text-white">
                  {currentAdmin?.fullName ?? "—"}
                </dd>
                <dd className="text-xs text-slate-500">{currentAdmin?.email ?? ""}</dd>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Idle timeout
                </dt>
                <dd className="mt-1 text-sm text-slate-200">
                  {sessionInactivityMinutes()} minutes of inactivity
                </dd>
              </div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Protection
                </dt>
                <dd className="mt-1 text-sm text-slate-300">
                  Server-side sessions, sign-out revocation, and brute-force lockout after failed
                  attempts.
                </dd>
              </div>
            </dl>
          </section>
        </div>
      ) : (
        <section className={platformCardClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <Users className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h2 className="font-heading text-lg font-semibold text-white">
                  Platform operators
                </h2>
                <p className="text-sm text-slate-400">
                  People who can provision schools and manage billing
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={`${platformBtnPrimary} gap-2`}
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              Add operator
            </button>
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-slate-500">Loading operators…</p>
          ) : operators.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-700 px-4 py-12 text-center text-sm text-slate-500">
              No operators found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/60 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Last sign-in</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {operators.map((op) => {
                    const isSelf = op.id === currentAdmin?.id;
                    return (
                      <tr key={op.id} className="hover:bg-slate-800/20">
                        <td className="px-4 py-3.5 font-medium text-white">
                          {op.fullName}
                          {isSelf ? (
                            <span className="ml-2 rounded-md bg-violet-500/20 px-1.5 py-0.5 text-xs text-violet-200">
                              You
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3.5 text-slate-400">{op.email}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                              op.isActive
                                ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30"
                                : "bg-slate-700/40 text-slate-400 ring-slate-600/30"
                            }`}
                          >
                            {op.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">
                          {op.lastLoginAt
                            ? new Date(op.lastLoginAt).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Never"}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {op.isActive && !isSelf ? (
                            <button
                              type="button"
                              onClick={() => setDeactivateTarget(op)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                            >
                              <UserMinus className="h-3.5 w-3.5" aria-hidden />
                              Deactivate
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <PlatformModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add platform operator"
        description="They will receive credentials to sign in at platform.localhost"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className={platformBtnSecondary}
            >
              Cancel
            </button>
            <button
              type="submit"
              form={CREATE_FORM_ID}
              disabled={submitting}
              className={platformBtnPrimary}
            >
              {submitting ? "Creating…" : "Create operator"}
            </button>
          </>
        }
      >
        <form id={CREATE_FORM_ID} onSubmit={onCreateOperator} className="space-y-4">
          <label className={platformLabelClass}>
            Full name
            <input
              required
              className={platformInputClass}
              value={createForm.fullName}
              onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </label>
          <label className={platformLabelClass}>
            Email
            <input
              type="email"
              required
              className={platformInputClass}
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 px-4 py-3">
            <input
              type="checkbox"
              checked={createForm.autoPassword}
              onChange={(e) => setCreateForm((f) => ({ ...f, autoPassword: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-500"
            />
            <span className="text-sm text-slate-300">Generate a secure temporary password</span>
          </label>
          {!createForm.autoPassword ? (
            <label className={platformLabelClass}>
              Password
              <input
                type="password"
                required
                minLength={8}
                className={platformInputClass}
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              />
            </label>
          ) : null}
        </form>
      </PlatformModal>

      <PlatformModal
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate operator"
        description={
          deactivateTarget
            ? `${deactivateTarget.fullName} will be signed out and cannot access the platform.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeactivateTarget(null)}
              className={platformBtnSecondary}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmDeactivate()}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-red-600/90 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
            >
              {submitting ? "Deactivating…" : "Deactivate"}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-400">
          This action cannot be undone from the UI. You can add a new operator with the same email
          later if needed.
        </p>
      </PlatformModal>

      <PlatformModal
        open={Boolean(newOperatorCreds)}
        onClose={() => setNewOperatorCreds(null)}
        title="Operator created"
        description="Share these credentials securely — the password is shown once."
        footer={
          <button
            type="button"
            onClick={() => setNewOperatorCreds(null)}
            className={platformBtnPrimary}
          >
            Done
          </button>
        }
      >
        {newOperatorCreds ? (
          <dl className="space-y-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div>
              <dt className="text-xs text-slate-500">Name</dt>
              <dd className="font-medium text-white">{newOperatorCreds.fullName}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Email</dt>
              <dd className="font-mono text-sm text-violet-200">{newOperatorCreds.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Temporary password</dt>
              <dd className="font-mono text-sm text-amber-200">{newOperatorCreds.temporaryPassword}</dd>
            </div>
          </dl>
        ) : null}
      </PlatformModal>
    </PlatformShell>
  );
}
