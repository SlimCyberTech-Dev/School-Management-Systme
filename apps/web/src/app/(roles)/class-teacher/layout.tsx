import { AppShell } from "@/components/layout/shells/AppShell";
import { SHELL_NAV_CONFIG } from "@/components/layout/shells/navigation.config";

export default function ClassTeacherLayout({ children }: { children: React.ReactNode }) {
  return <AppShell config={SHELL_NAV_CONFIG["class-teacher"]}>{children}</AppShell>;
}
