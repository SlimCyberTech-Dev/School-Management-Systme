import { BRAND, COLORS } from "@uganda-cbc-sms/brand";
import { renderEmailShell } from "./shell.js";

const muted = COLORS.neutral[600];
const text = COLORS.neutral[900];
const linkColor = COLORS.accent.DEFAULT;

export function buildNotificationEmail(input: {
  title: string;
  body: string;
  actionUrl?: string | null;
  actionLabel?: string;
}): { subject: string; html: string; text: string } {
  const subject = `${BRAND.productName} — ${input.title}`;

  const actionBlock = input.actionUrl
    ? `<p style="margin:24px 0 0;">
         <a href="${escapeAttr(input.actionUrl)}"
            style="display:inline-block;padding:12px 20px;background:${linkColor};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
           ${escapeHtml(input.actionLabel ?? "Open in SchoolManage")}
         </a>
       </p>`
    : "";

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${text};font-weight:600;">
      ${escapeHtml(input.title)}
    </p>
    <p style="margin:0;font-size:15px;line-height:1.7;color:${muted};">
      ${escapeHtml(input.body)}
    </p>
    ${actionBlock}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${muted};">
      You can manage notification preferences in your account settings.
    </p>`;

  const { html, text: plainShell } = renderEmailShell({
    title: input.title,
    bodyHtml,
  });

  const plainLines = [plainShell, "", input.body];
  if (input.actionUrl) {
    plainLines.push("", input.actionUrl);
  }

  return { subject, html, text: plainLines.join("\n") };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
