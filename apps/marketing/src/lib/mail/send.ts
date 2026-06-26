import nodemailer from "nodemailer";
import { getMailConfig } from "./config";
import {
  buildAdminContactEmail,
  buildVisitorAutoReply,
  type ContactSubmission,
} from "./templates";

export async function sendContactEmails(submission: ContactSubmission) {
  const config = getMailConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  const adminMail = buildAdminContactEmail(submission);
  const visitorMail = buildVisitorAutoReply(submission);

  await transporter.sendMail({
    from: config.from,
    to: config.inbox,
    replyTo: submission.email,
    subject: adminMail.subject,
    html: adminMail.html,
    text: adminMail.text,
  });

  await transporter.sendMail({
    from: config.from,
    to: submission.email,
    subject: visitorMail.subject,
    html: visitorMail.html,
    text: visitorMail.text,
  });
}
