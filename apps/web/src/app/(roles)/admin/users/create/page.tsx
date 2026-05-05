"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { createUserSchema, ROLES } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiPost } from "@/lib/api";
import { useState } from "react";

type Form = z.infer<typeof createUserSchema> & { forcePasswordChange?: boolean; notes?: string };

export default function AdminUsersCreatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Form>({ resolver: zodResolver(createUserSchema) });

  const onSubmit = async (v: Form) => {
    setError(null);
    try {
      await apiPost("/users", v);
      router.push("/admin/users");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create user");
    }
  };

  return (
    <PageWrapper title="Create user" description="New staff account">
      <Card title="Account details">
        <form className="max-w-lg space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <Input label="Full name" {...form.register("fullName")} error={form.formState.errors.fullName?.message} />
          <Input label="Email" {...form.register("email")} error={form.formState.errors.email?.message} />
          <Input
            label="Temporary password"
            type="password"
            {...form.register("password")}
            error={form.formState.errors.password?.message}
          />
          <Select
            label="Role"
            options={ROLES.map((r) => ({
              value: r,
              label: r.replace(/_/g, " "),
            }))}
            {...form.register("role")}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("forcePasswordChange")} />
            Force password change on first login
          </label>
          <div>
            <label className="mb-1 block text-sm font-medium">Admin notes</label>
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              {...form.register("notes")}
            />
          </div>
          <Button type="submit">Create</Button>
        </form>
      </Card>
    </PageWrapper>
  );
}
