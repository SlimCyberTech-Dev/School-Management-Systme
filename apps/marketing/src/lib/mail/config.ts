import { contactEmail } from "@/lib/contact";

function required(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return trimmed;
}

export function getMailConfig() {
  const user = required("SMTP_USER", process.env.SMTP_USER);
  const pass = required("SMTP_PASS", process.env.SMTP_PASS);
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const fromName = process.env.SMTP_FROM_NAME?.trim() || "SchoolManage";
  const inbox = process.env.CONTACT_INBOX?.trim() || contactEmail;

  return {
    host,
    port,
    secure,
    auth: { user, pass },
    from: `${fromName} <${user}>`,
    inbox,
  };
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}
