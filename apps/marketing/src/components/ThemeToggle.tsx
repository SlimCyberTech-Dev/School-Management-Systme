"use client";

import { useEffect, useRef, useState } from "react";
import { readThemeChoice, resolveTheme, setThemeChoice, type ThemeChoice } from "@/lib/theme";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = readThemeChoice();
    setTheme(stored);
    setResolvedTheme(resolveTheme(stored));
    setMounted(true);
  }, []);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!mounted) {
    return (
      <span
        className="inline-flex h-9 w-9 shrink-0 rounded-md border border-border bg-card"
        aria-hidden
      />
    );
  }

  const options: { id: ThemeChoice; label: string; Icon: typeof SunIcon }[] = [
    { id: "light", label: "Light", Icon: SunIcon },
    { id: "dark", label: "Dark", Icon: MoonIcon },
    { id: "system", label: "System", Icon: MonitorIcon },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme appearance menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {resolvedTheme === "dark" ? <MoonIcon /> : <SunIcon />}
      </button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-50 mt-1 min-w-[10rem] rounded-md border border-border bg-card py-1 shadow-lg"
        >
          {options.map(({ id, label, Icon }) => {
            const active = theme === id;
            return (
              <li key={id} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  onClick={() => {
                    setTheme(id);
                    setThemeChoice(id);
                    setResolvedTheme(resolveTheme(id));
                    setOpen(false);
                  }}
                >
                  <Icon />
                  <span className="flex-1">{label}</span>
                  {active ? <span className="text-xs text-brand">✓</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
