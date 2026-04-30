"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { createUserSchema, ROLES } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiGet, apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Form = z.infer<typeof createUserSchema>;

export default function UsersPage() {
  const allowed = useAuthStore((s) => s.hasRole("admin"));
  const [users, setUsers] = useState<unknown[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const form = useForm<Form>({ resolver: zodResolver(createUserSchema) });

  useEffect(() => {
    if (!allowed) return;
    void (async () => {
      try {
        const r = await apiGet("/users");
        setUsers(r as unknown[]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed");
      }
    })();
  }, [allowed]);

  if (!allowed) {
    return (
      <PageWrapper title="Users" description="Admin only">
        <p className="text-red-600">Forbidden</p>
      </PageWrapper>
    );
  }

  const onSubmit = async (v: Form) => {
    await apiPost("/users", v);
    const r = await apiGet("/users");
    setUsers(r as unknown[]);
    form.reset();
  };

  return (
    <PageWrapper title="User management" description="Create and review staff accounts">
      <div className="grid gap-8 lg:grid-cols-2">
        <Card title="Create user">
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
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
                label: r.replace("_", " "),
              }))}
              {...form.register("role")}
            />
            <Button type="submit">Create</Button>
          </form>
        </Card>
        <Card title={`Users (${users.length})`}>
          {err ? <p className="text-red-600">{err}</p> : null}
          <pre className="max-h-[480px] overflow-auto text-xs">{JSON.stringify(users, null, 2)}</pre>
        </Card>
      </div>
    </PageWrapper>
  );
}
