"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { ROLES, updateUserSchema } from "@uganda-cbc-sms/shared";
import type { UserPublic } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiGet, apiPatch } from "@/lib/api";

type Form = z.infer<typeof updateUserSchema>;

export default function AdminUsersEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params["id"]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm<Form>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: "",
      email: "",
      role: "subject_teacher",
      isActive: true,
    },
  });

  useEffect(() => {
    void (async () => {
      try {
        const user = await apiGet<UserPublic>(`/users/${encodeURIComponent(id)}`);
        form.reset({
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load user");
      } finally {
        setLoading(false);
      }
    })();
  }, [form, id]);

  const onSubmit = async (v: Form) => {
    setErr(null);
    try {
      await apiPatch(`/users/${encodeURIComponent(id)}`, {
        fullName: v.fullName?.trim(),
        email: v.email?.toLowerCase().trim(),
        role: v.role,
        isActive: v.isActive,
      });
      router.push("/admin/users");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update user");
    }
  };

  return (
    <PageWrapper title="Edit user" description="Update staff account details">
      {loading ? <p className="text-muted-foreground">Loading…</p> : null}
      {err ? <p className="mb-3 text-red-600">{err}</p> : null}
      {!loading ? (
        <Card title="Account details">
          <form className="max-w-lg space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <Input
              label="Full name"
              {...form.register("fullName")}
              error={form.formState.errors.fullName?.message}
            />
            <Input
              label="Email"
              type="email"
              {...form.register("email")}
              error={form.formState.errors.email?.message}
            />
            <Select
              label="Role"
              options={ROLES.map((r) => ({
                value: r,
                label: r.replace(/_/g, " "),
              }))}
              {...form.register("role")}
              error={form.formState.errors.role?.message}
            />
            <Select
              label="Status"
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              value={form.watch("isActive") ? "active" : "inactive"}
              onChange={(e) => form.setValue("isActive", e.target.value === "active")}
            />
            <div className="flex gap-2 pt-2">
              <Button type="submit">Save changes</Button>
              <Button type="button" variant="secondary" onClick={() => router.push("/admin/users")}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </PageWrapper>
  );
}
