import { NextResponse } from "next/server";
import { isMailConfigured } from "@/lib/mail/config";
import { sendContactEmails } from "@/lib/mail/send";
import type { ContactSubmission } from "@/lib/mail/templates";

export const runtime = "nodejs";

type ContactPayload = ContactSubmission & { website?: string };

function parseBody(body: unknown): ContactSubmission | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const name = String(record.name ?? "").trim();
  const school = String(record.school ?? "").trim();
  const email = String(record.email ?? "").trim();
  const phone = String(record.phone ?? "").trim();
  const message = String(record.message ?? "").trim();

  if (!name || !school || !email || !phone || !message) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (message.length > 5000) return null;

  return { name, school, email, phone, message };
}

export async function POST(request: Request) {
  if (!isMailConfigured()) {
    return NextResponse.json(
      { error: "Email is not configured on the server. Please use the phone or WhatsApp options." },
      { status: 503 },
    );
  }

  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (payload.website) {
    return NextResponse.json({ ok: true });
  }

  const submission = parseBody(payload);
  if (!submission) {
    return NextResponse.json({ error: "Please fill in all required fields with valid details." }, { status: 400 });
  }

  try {
    await sendContactEmails(submission);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact email failed:", error);
    return NextResponse.json(
      { error: "We could not send your message right now. Please try again or contact us directly." },
      { status: 500 },
    );
  }
}
