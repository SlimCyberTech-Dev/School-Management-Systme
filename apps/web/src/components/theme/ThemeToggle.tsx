"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

type ThemeChoice = "light" | "dark" | "system";

type ThemeToggleProps = {
  /** Merged onto the trigger button (e.g. contrast on colored headers) */
  buttonClassName?: string;
};

export function ThemeToggle({ buttonClassName = "" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  if (!mounted) {
    return (
      <span
        className="inline-flex h-9 w-9 shrink-0 rounded-md border border-border bg-card"
        aria-hidden
      />
    );
  }

  const ResolvedIcon = resolvedTheme === "dark" ? Moon : Sun;

  const options: { id: ThemeChoice; label: string; Icon: typeof Sun }[] = [
    { id: "light", label: "Light", Icon: Sun },
    { id: "dark", label: "Dark", Icon: Moon },
    { id: "system", label: "System", Icon: Monitor },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Theme appearance menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${buttonClassName}`}
      >
        <ResolvedIcon className="h-4 w-4" aria-hidden />
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
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  onClick={() => {
                    setTheme(id);
                    setOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
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
