"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { GuideStep } from "./guideContent";

const linkButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg border border-border bg-card px-4 text-xs font-medium text-foreground transition-ui hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function GuideWorkflowAccordion({ steps }: { steps: GuideStep[] }) {
  const [openId, setOpenId] = useState<string | null>(steps[0]?.id ?? null);

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const open = openId === step.id;
        const Icon = step.icon;
        return (
          <div
            key={step.id}
            className={`overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-ui ${
              open ? "ring-1 ring-brand/20" : "hover:bg-accent/30"
            }`}
          >
            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-ui hover:bg-accent/40"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : step.id)}
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 transition-ui ${
                  open ? "border-brand/30 bg-brand/10 text-brand" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{step.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </span>
                {open ? (
                  <span className="mt-1 block text-sm text-muted-foreground">{step.description}</span>
                ) : null}
              </span>
            </button>
            {open ? (
              <div className="border-t border-border bg-muted/20 px-4 py-3 pl-[3.75rem]">
                <Link href={step.href} className={linkButtonClass}>
                  Go to this screen
                </Link>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
