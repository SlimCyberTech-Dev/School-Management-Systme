import { ReactNode } from "react";
import { motion } from "framer-motion";
import { authPageMotion, authPageTransition } from "./AuthMotion";

type AuthCardProps = {
  children: ReactNode;
  motionKey: string;
};

export function AuthCard({ children, motionKey }: AuthCardProps) {
  return (
    <motion.div
      key={motionKey}
      variants={authPageMotion}
      initial="enter"
      animate="center"
      exit="exit"
      transition={authPageTransition}
      className="w-full"
    >
      <div className="rounded-3xl border border-border bg-card/90 p-5 shadow-lg backdrop-blur-xl dark:bg-card/95 sm:p-6">
        {children}
      </div>
    </motion.div>
  );
}
