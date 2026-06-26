"use client";

import { useState } from "react";

/**
 * Static-export contact form. Wire up a third-party handler (Formspree, Tally, Getform, etc.):
 *
 * 1. Create a form endpoint at your provider and copy its POST URL.
 * 2. Set NEXT_PUBLIC_CONTACT_FORM_ENDPOINT in apps/marketing/.env (see .env.example).
 * 3. Rebuild the marketing site (`npm run build:marketing`).
 *
 * If the endpoint is unset, submit opens a mailto: fallback instead of posting.
 */
const formEndpoint = process.env.NEXT_PUBLIC_CONTACT_FORM_ENDPOINT ?? "";
const fallbackEmail = "hello@slimcybertech.com";

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    if (!formEndpoint) {
      const subject = encodeURIComponent(`SchoolManage enquiry from ${data.get("name")}`);
      const body = encodeURIComponent(
        `Name: ${data.get("name")}\nSchool: ${data.get("school")}\nEmail: ${data.get("email")}\nPhone: ${data.get("phone")}\n\n${data.get("message")}`,
      );
      window.location.href = `mailto:${fallbackEmail}?subject=${subject}&body=${body}`;
      return;
    }

    setState("submitting");
    setErrorMessage("");

    try {
      const response = await fetch(formEndpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Unable to send your message. Please try the email link below.");
      }

      form.reset();
      setState("success");
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="surface-card p-6 md:p-8">
      {!formEndpoint ? (
        <p className="mb-6 rounded-lg border border-border bg-muted/50 px-4 py-3 text-small text-muted-foreground">
          Form handler not configured yet. Submissions will open your email app, or you can email us directly at{" "}
          <a href={`mailto:${fallbackEmail}`} className="link-brand">
            {fallbackEmail}
          </a>
          .
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-small font-medium text-foreground">
              Your name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-small text-foreground transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
          <div>
            <label htmlFor="school" className="block text-small font-medium text-foreground">
              School name
            </label>
            <input
              id="school"
              name="school"
              type="text"
              required
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-small text-foreground transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-small font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-small text-foreground transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-small font-medium text-foreground">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-small text-foreground transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-small font-medium text-foreground">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-small text-foreground transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
            placeholder="Tell us about your school and what you need help with."
          />
        </div>

        <button type="submit" disabled={state === "submitting"} className="btn-primary disabled:opacity-60">
          {state === "submitting" ? "Sending…" : "Send message"}
        </button>

        {state === "success" ? (
          <p className="text-small font-medium text-brand">Thank you — we received your message and will be in touch soon.</p>
        ) : null}
        {state === "error" ? <p className="text-small text-red-700 dark:text-red-400">{errorMessage}</p> : null}
      </form>

      <p className="mt-6 text-small text-muted-foreground">
        Prefer email?{" "}
        <a href={`mailto:${fallbackEmail}`} className="link-brand">
          {fallbackEmail}
        </a>
      </p>
    </div>
  );
}
