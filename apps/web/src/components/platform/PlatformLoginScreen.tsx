"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";
import { platformApi } from "@/lib/platformApi";
import { sessionInactivityMinutes } from "@/lib/sessionConfig";
import { platformApiError } from "@/components/platform/platformUtils";
import { toast } from "@/lib/toast";
import { usePlatformStore } from "@/store/platformStore";

const CAPABILITIES = [
  { icon: Building2, label: "Provision schools" },
  { icon: CreditCard, label: "Manage billing" },
  { icon: Activity, label: "Audit activity" },
] as const;

export function PlatformLoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = usePlatformStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const sessionNotice =
    searchParams.get("reason") === "timeout"
      ? `Session expired after ${sessionInactivityMinutes()} minutes of inactivity.`
      : searchParams.get("reason") === "session"
        ? "Your session ended. Sign in again to continue."
        : null;

  useEffect(() => {
    if (sessionNotice) {
      toast.info(sessionNotice, "Session ended");
    }
  }, [sessionNotice]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await platformApi.post("/auth/login", { email, password });
      const payload = res.data?.data as {
        token?: string;
        admin?: { id: string; email: string; fullName: string };
        session?: { inactivityMinutes: number; idleExpiresAt: string };
      };
      if (!payload?.token || !payload.admin) throw new Error("No token returned");
      login(payload.admin, payload.token, payload.session);
      toast.success("Welcome to the control plane.", "Signed in");
      router.push("/platform/tenants");
    } catch (err: unknown) {
      const msg =
        platformApiError(err) ?? "Check your email and password, then try again.";
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030712] text-slate-100">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-indigo-600/15 blur-[100px]" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(139,92,246,0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030712]/40 to-[#030712]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        {/* Hero panel — command-center identity */}
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col justify-between px-8 py-10 lg:px-14 lg:py-14"
        >
          <div>
            <div className="inline-flex items-center gap-3">
              <Image
                src="/images/Logo.jpeg"
                alt="SlimCyberTech"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover ring-2 ring-violet-500/30"
              />
              <div>
                <p className="font-heading text-sm font-semibold tracking-wide text-white">
                  SlimCyberTech
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400/90">
                  Control plane
                </p>
              </div>
            </div>

            <div className="mt-14 max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-200"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                Operator access only
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.55 }}
                className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-white lg:text-5xl"
              >
                Platform
                <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-300 bg-clip-text text-transparent">
                  administration
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.5 }}
                className="mt-5 text-base leading-relaxed text-slate-400"
              >
                Secure console for provisioning schools, configuring modules, and overseeing
                tenant billing — separate from everyday school staff sign-in.
              </motion.p>
            </div>
          </div>

          <motion.ul
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-10 flex flex-wrap gap-3 lg:mt-0"
          >
            {CAPABILITIES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-2.5 text-sm text-slate-300 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-violet-400" aria-hidden />
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.section>

        {/* Sign-in card */}
        <section className="flex flex-1 items-center justify-center px-6 pb-12 pt-4 lg:px-12 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="w-full max-w-[420px]"
          >
            <div className="relative">
              <div className="pointer-events-none absolute -inset-px rounded-[1.35rem] bg-gradient-to-b from-violet-500/40 via-indigo-500/20 to-transparent opacity-80" />
              <motion.form
                onSubmit={onSubmit}
                animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                transition={{ duration: 0.45 }}
                className="relative space-y-5 rounded-[1.25rem] border border-slate-800/90 bg-slate-950/80 p-8 shadow-2xl shadow-violet-950/30 backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/30 to-indigo-600/20 ring-1 ring-violet-500/40">
                      <Shield className="h-5 w-5 text-violet-200" aria-hidden />
                    </div>
                    <h2 className="font-heading text-xl font-semibold text-white">
                      Operator sign-in
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Authenticate with your platform credentials
                    </p>
                  </div>
                </div>

                {sessionNotice ? (
                  <div
                    role="status"
                    className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-100/90"
                  >
                    {sessionNotice}
                  </div>
                ) : null}

                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-200"
                  >
                    {error}
                  </div>
                ) : null}

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                      Email
                    </span>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
                        aria-hidden
                      />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="operator@company.com"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-500">
                      Password
                    </span>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
                        aria-hidden
                      />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pl-10 pr-11 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-300"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Authenticating…
                      </>
                    ) : (
                      "Enter control plane"
                    )}
                  </span>
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition group-hover:opacity-100" />
                </button>

                <p className="text-center text-xs leading-relaxed text-slate-600">
                  School staff use their school subdomain — not this console.
                  <br />
                  Sessions expire after {sessionInactivityMinutes()} min idle.
                </p>
              </motion.form>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
