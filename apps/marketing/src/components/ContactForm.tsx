"use client";

import { useState } from "react";
import { contactEmail } from "@/lib/contact";

type FormState = "idle" | "submitting" | "success" | "error";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-small text-foreground shadow-sm transition-[border-color,box-shadow] focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";

const labelClass = "block text-small font-medium text-foreground";

export function ContactForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setState("submitting");
    setErrorMessage("");

    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
      school: (form.elements.namedItem("school") as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem("email") as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim(),
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value.trim(),
      website: (form.elements.namedItem("website") as HTMLInputElement).value,
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to send your message. Please try again.");
      }

      form.reset();
      setState("success");
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-border bg-brand-light/40 px-6 py-5 dark:bg-brand-dark/20 md:px-8">
        <h2 className="text-heading-2 text-foreground">Send a message</h2>
        <p className="mt-1 text-small text-muted-foreground">
          We typically reply within one business day. You will receive a confirmation email.
        </p>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden
          />

          <fieldset className="space-y-4">
            <legend className="text-caption uppercase text-muted-foreground">About you</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Your name
                </label>
                <input id="name" name="name" type="text" required autoComplete="name" className={inputClass} />
              </div>
              <div>
                <label htmlFor="school" className={labelClass}>
                  School name
                </label>
                <input id="school" name="school" type="text" required className={inputClass} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-caption uppercase text-muted-foreground">Contact details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone
                </label>
                <input id="phone" name="phone" type="tel" required autoComplete="tel" className={inputClass} />
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-caption uppercase text-muted-foreground">Your enquiry</legend>
            <div>
              <label htmlFor="message" className={labelClass}>
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                className={inputClass}
                placeholder="School size, modules you need (CBC, UNEB, fees), and any questions."
              />
            </div>
          </fieldset>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="submit" disabled={state === "submitting"} className="btn-primary disabled:opacity-60">
              {state === "submitting" ? "Sending…" : "Send message"}
            </button>
            <p className="text-small text-muted-foreground">
              Or email{" "}
              <a href={`mailto:${contactEmail}`} className="link-brand">
                {contactEmail}
              </a>
            </p>
          </div>

          {state === "success" ? (
            <p className="rounded-lg border border-brand/25 bg-brand-light/50 px-4 py-3 text-small font-medium text-brand-dark dark:bg-brand-dark/30 dark:text-green-200">
              Thank you. We received your message and sent a confirmation to your inbox.
            </p>
          ) : null}
          {state === "error" ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-small text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
