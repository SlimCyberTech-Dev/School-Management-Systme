"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

export function Header() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="text-sm text-slate-600">
        Signed in as <span className="font-medium text-slate-900">{user?.fullName}</span>{" "}
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {user?.role?.replace("_", " ")}
        </span>
      </div>
      <Button
        variant="secondary"
        onClick={() => {
          logout();
          router.replace("/login");
        }}
      >
        Logout
      </Button>
    </header>
  );
}
