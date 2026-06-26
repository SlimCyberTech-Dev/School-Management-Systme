import { BRAND } from "@uganda-cbc-sms/brand";
import { siteUrl } from "@/lib/seo";

export type ContactSubmission = {
  name: string;
  school: string;
  email: string;
  phone: string;
  message: string;
};

const brandGreen = "#1B6B3A";
const brandGreenDark = "#14532d";
const accentBlue = "#1D4ED8";
const text = "#0f172a";
const muted = "#475569";
const border = "#e2e8f0";
const surface = "#f8fafc";

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${surface};font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${text};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${surface};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid ${border};border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,${brandGreen} 0%,${brandGreenDark} 100%);padding:28px 32px;">
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.82);">${BRAND.companyName}</p>
              <h1 style="margin:0;font-size:24px;line-height:1.2;color:#ffffff;font-weight:700;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">${body}</td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${border};background:#fcfdfe;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:${muted};">
                ${BRAND.productName} · School management for Ugandan secondary schools<br />
                <a href="${siteUrl}" style="color:${accentBlue};text-decoration:none;">${siteUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function fieldRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${border};vertical-align:top;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${muted};font-weight:600;">${label}</p>
        <p style="margin:0;font-size:15px;line-height:1.5;color:${text};white-space:pre-wrap;">${escapeHtml(value)}</p>
      </td>
    </tr>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAdminContactEmail(submission: ContactSubmission) {
  const subject = `New enquiry from ${submission.school} — ${submission.name}`;
  const body = `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${muted};">
      A new message arrived through the ${BRAND.productName} contact form.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid ${border};border-radius:12px;background:${surface};padding:4px 20px;">
      ${fieldRow("Name", submission.name)}
      ${fieldRow("School", submission.school)}
      ${fieldRow("Email", submission.email)}
      ${fieldRow("Phone", submission.phone)}
      <tr>
        <td style="padding:12px 0;vertical-align:top;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:${muted};font-weight:600;">Message</p>
          <p style="margin:0;font-size:15px;line-height:1.6;color:${text};white-space:pre-wrap;">${escapeHtml(submission.message)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;">
      <a href="mailto:${escapeHtml(submission.email)}" style="display:inline-block;background:${brandGreen};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:999px;">
        Reply to ${escapeHtml(submission.name)}
      </a>
    </p>`;

  return {
    subject,
    html: layout("New school enquiry", body),
    text: [
      subject,
      "",
      `Name: ${submission.name}`,
      `School: ${submission.school}`,
      `Email: ${submission.email}`,
      `Phone: ${submission.phone}`,
      "",
      submission.message,
    ].join("\n"),
  };
}

export function buildVisitorAutoReply(submission: ContactSubmission) {
  const subject = `We received your message — ${BRAND.productName}`;
  const body = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${text};">
      Hi ${escapeHtml(submission.name)},
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${muted};">
      Thank you for contacting ${BRAND.productName}. We received your enquiry about
      <strong style="color:${text};">${escapeHtml(submission.school)}</strong> and will get back to you within one business day.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border:1px solid ${border};border-radius:12px;background:${surface};">
      <tr>
        <td style="padding:18px 20px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${muted};font-weight:600;">Your message</p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:${text};white-space:pre-wrap;">${escapeHtml(submission.message)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;line-height:1.6;color:${muted};">
      If your request is urgent, reply to this email or call us on the number listed on our contact page.
    </p>`;

  return {
    subject,
    html: layout("Thanks for getting in touch", body),
    text: [
      `Hi ${submission.name},`,
      "",
      `Thank you for contacting ${BRAND.productName}. We received your enquiry about ${submission.school} and will reply within one business day.`,
      "",
      "Your message:",
      submission.message,
    ].join("\n"),
  };
}
