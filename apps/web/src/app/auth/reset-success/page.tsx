"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { AuthBackLink, AuthFooterLink } from "@/components/auth/AuthBackLink";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PrimaryButton } from "@/components/auth/PrimaryButton";
import { useCountdown } from "@/hooks/useCountdown";

export default function ResetSuccessPage() {
  const router = useRouter();
  const countdown = useCountdown(5, true);

  useEffect(() => {
    if (countdown.secondsLeft === 0) router.push("/login");
  }, [countdown.secondsLeft, router]);

  return (
    <AuthLayout supportingCopy="Your password has been updated.">
      <AuthCard motionKey="reset-success">
        <AuthBackLink href="/login" />
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mb-4 inline-flex"
          >
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
          </motion.div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">You&apos;re all set!</h1>
          <p className="font-body mt-2 text-sm text-muted-foreground">
            Your password has been successfully reset.
          </p>
          <p className="font-body mt-4 text-sm text-muted-foreground">
            Redirecting to sign in in {countdown.secondsLeft}s…
          </p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-brand"
              animate={{ width: `${countdown.progress * 100}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={() => router.push("/login")}>Sign In Now</PrimaryButton>
          </div>
          <AuthFooterLink href="/login">← Back to Sign In</AuthFooterLink>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
