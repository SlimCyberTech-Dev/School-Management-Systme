"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Mail } from "lucide-react";
import { useMemo, useState } from "react";
import { AuthBackLink, AuthFooterLink } from "@/components/auth/AuthBackLink";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { stateMotion } from "@/components/auth/AuthMotion";
import {
  AUTH_COPY,
  PASSWORD_RESET_CODE_EXPIRES_MINUTES,
  PASSWORD_RESET_RESEND_COOLDOWN_SECONDS,
} from "@/components/auth/constants";
import { FormInput } from "@/components/auth/FormInput";
import { PrimaryButton } from "@/components/auth/PrimaryButton";
import { useCountdown } from "@/hooks/useCountdown";
import { apiPost, getApiErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const cooldown = useCountdown(PASSWORD_RESET_RESEND_COOLDOWN_SECONDS, false);

  const emailError = useMemo(() => {
    if (!touched) return "";
    if (!email.trim()) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Enter a valid email address.";
    return "";
  }, [email, touched]);

  const requestCode = async () => {
    setError("");
    setLoading(true);
    try {
      await apiPost<{ expiresInSeconds: number }>("/auth/password-reset/request-code", {
        email: email.trim(),
      });
      setSent(true);
      cooldown.reset(PASSWORD_RESET_RESEND_COOLDOWN_SECONDS);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setTouched(true);
    if (emailError || !email) return;
    await requestCode();
  };

  const resend = async () => {
    if (cooldown.secondsLeft > 0 || loading) return;
    await requestCode();
  };

  return (
    <AuthLayout supportingCopy="We'll send a secure 6-digit code to reset your password.">
      <AuthCard motionKey="forgot-password">
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              variants={stateMotion}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <AuthBackLink href="/login" />
              <h1 className="font-heading text-2xl font-semibold text-foreground">Forgot your password?</h1>
              <p className="font-body mt-1.5 text-sm text-muted-foreground">{AUTH_COPY.forgotSubtitle}</p>

              <motion.div
                className="mt-5 space-y-4"
                animate={emailError ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <FormInput
                  id="forgot-email"
                  label="Email"
                  icon={Mail}
                  value={email}
                  onChange={setEmail}
                  placeholder="you@company.com"
                  error={emailError}
                />

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <PrimaryButton type="button" onClick={submit} loading={loading}>
                  Send Reset Code
                </PrimaryButton>
              </motion.div>
              <AuthFooterLink href="/login">← Back to Sign In</AuthFooterLink>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              variants={stateMotion}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="py-3 text-center"
            >
              <AuthBackLink href="/login" className="mb-4" />
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="mb-3 inline-flex"
              >
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              </motion.div>
              <h2 className="font-heading text-2xl font-semibold text-foreground">Check your inbox</h2>
              <p className="font-body mt-2 text-sm text-muted-foreground">
                We sent a 6-digit reset code to <span className="font-semibold text-foreground">{email}</span>.
                It expires in {PASSWORD_RESET_CODE_EXPIRES_MINUTES} minutes.
              </p>
              <div className="mt-4">
                <PrimaryButton onClick={() => router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)}>
                  Enter Reset Code
                </PrimaryButton>
              </div>
              <p className="font-body mt-5 text-sm text-muted-foreground">
                Didn&apos;t receive it?{" "}
                <button
                  type="button"
                  onClick={() => void resend()}
                  disabled={cooldown.secondsLeft > 0 || loading}
                  className="font-semibold text-brand hover:underline disabled:text-muted-foreground"
                >
                  Resend
                </button>{" "}
                {cooldown.secondsLeft > 0 ? `in 0:${cooldown.secondsLeft.toString().padStart(2, "0")}` : ""}
              </p>
              {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
              <AuthFooterLink href="/login">← Back to Sign In</AuthFooterLink>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </AuthLayout>
  );
}
