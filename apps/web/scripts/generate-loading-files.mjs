import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "src", "app", "(roles)");

const specs = [
  ["admin", "table", ["students", "users", "fees", "academic", "exams", "reports", "assessment", "attendance", "audit-logs"]],
  ["admin", "dashboard", ["dashboard"]],
  ["admin", "form", ["settings"]],
  ["headteacher", "table", ["students", "fees", "assessment", "reports", "exams", "academic", "attendance", "users"]],
  ["headteacher", "dashboard", ["dashboard"]],
  ["headteacher", "analytics", ["analytics"]],
  ["bursar", "table", ["fees", "students"]],
  ["bursar", "dashboard", ["dashboard"]],
  ["class-teacher", "table", ["students", "attendance", "exams", "timetable", "comments"]],
  ["class-teacher", "dashboard", ["dashboard"]],
  ["class-teacher", "form", ["assessment"]],
  ["subject-teacher", "table", ["students", "attendance", "exams", "timetable"]],
  ["subject-teacher", "dashboard", ["dashboard"]],
  ["subject-teacher", "form", ["assessment"]],
];

const template = (variant) => `import { createPageLoading } from "@/components/feedback/page-loading/createPageLoading";

export default createPageLoading("${variant}");
`;

for (const [role, variant, segments] of specs) {
  const roleDir = join(root, role);
  writeFileSync(join(roleDir, "loading.tsx"), template("table"));
  for (const seg of segments) {
    const dir = join(roleDir, seg);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "loading.tsx"), template(variant));
  }
}

console.log("Generated loading.tsx files");
