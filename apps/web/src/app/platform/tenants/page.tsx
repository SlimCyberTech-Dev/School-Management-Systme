"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLATFORM_TOKEN_KEY, platformApi, setPlatformToken } from "@/lib/platformApi";
import { schoolLoginUrl } from "@/lib/tenantHost";

type Tenant = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  subdomain: string;
  schoolName: string | null;
  createdAt: string;
};

export default function PlatformTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    displayName: "",
    adminEmail: "",
    adminPassword: "",
    adminFullName: "",
  });

  const load = useCallback(async () => {
    try {
      const res = await platformApi.get("/tenants");
      setTenants(res.data?.data ?? []);
      setError(null);
    } catch {
      setError("Could not load tenants. Sign in again.");
      setPlatformToken(null);
      router.replace("/platform/login");
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTenant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await platformApi.post("/tenants", {
        slug: form.slug,
        displayName: form.displayName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
        adminFullName: form.adminFullName || undefined,
      });
      setShowForm(false);
      setForm({
        slug: "",
        displayName: "",
        adminEmail: "",
        adminPassword: "",
        adminFullName: "",
      });
      await load();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ??
            "Create failed")
          : "Create failed";
      setError(msg);
    }
  }

  function signOut() {
    setPlatformToken(null);
    document.cookie = `${PLATFORM_TOKEN_KEY}=; path=/; max-age=0`;
    router.push("/platform/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <h1 className="text-lg font-semibold">School tenants</h1>
        <button
          type="button"
          onClick={signOut}
          className="text-sm text-slate-400 hover:text-white"
        >
          Sign out
        </button>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {error ? (
          <p className="mb-4 rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p>
        ) : null}
        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500"
          >
            {showForm ? "Cancel" : "Add school"}
          </button>
        </div>
        {showForm ? (
          <form
            onSubmit={createTenant}
            className="mb-8 grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-6 sm:grid-cols-2"
          >
            <label className="text-sm">
              Slug (subdomain)
              <input
                required
                pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?"
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="kampala-high"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              />
            </label>
            <label className="text-sm">
              School name
              <input
                required
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Admin email
              <input
                type="email"
                required
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Admin password
              <input
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Admin full name (optional)
              <input
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                value={form.adminFullName}
                onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
              />
            </label>
            <button
              type="submit"
              className="sm:col-span-2 rounded-md bg-emerald-600 py-2 text-sm font-medium hover:bg-emerald-500"
            >
              Create school
            </button>
          </form>
        ) : null}
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sign-in URL</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-slate-800">
                  <td className="px-4 py-3">{t.displayName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{t.slug}</td>
                  <td className="px-4 py-3 capitalize">{t.status}</td>
                  <td className="px-4 py-3">
                    <a
                      href={schoolLoginUrl(t.slug)}
                      className="text-blue-400 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tenants.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">No schools yet.</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
