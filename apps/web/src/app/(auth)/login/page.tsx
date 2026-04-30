"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { loginSchema, type UserPublic } from "@uganda-cbc-sms/shared";
import type { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiPost } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type Form = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: Form) => {
    setErr(null);
    setLoading(true);
    try {
      const data = await apiPost<{ token: string; user: UserPublic }>("/auth/login", values);
      setSession(data.token, data.user);
      router.replace("/dashboard");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light px-4">
      <Card title="Staff Login">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
          <p className="text-center text-xs text-slate-500">
            Uganda CBC SMS — authorized personnel only
          </p>
        </form>
      </Card>
    </div>
  );
}
